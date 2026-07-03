'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Shield, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: 'monthly' | 'yearly';
  };
}

export default function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const { user, upgradeSubscription } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Payment methods: 'card' | 'upi' | 'paypal' | 'netbanking'
  const [method, setMethod] = useState<'card' | 'upi' | 'paypal' | 'netbanking'>('card');
  
  // Promo code
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');

  // Loading & Success states
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const basePrice = plan.billingCycle === 'yearly' ? plan.price * 0.8 : plan.price;
  const tax = Number((basePrice * 0.18).toFixed(2)); // 18% GST
  const discountAmount = Number((basePrice * discount).toFixed(2));
  const finalPrice = Math.max(0, Number((basePrice + tax - discountAmount).toFixed(2)));

  useEffect(() => {
    // Reset states on open
    if (isOpen) {
      setMethod('card');
      setPromo('');
      setDiscount(0);
      setAppliedCode('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
      setUpiId('');
      setSelectedBank('SBI');
      setProcessing(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleApplyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (code === 'WELCOMEBACK50') {
      setDiscount(0.5);
      setAppliedCode(code);
      toast.success('Promo code "WELCOMEBACK50" applied! 50% discount.');
    } else {
      toast.error('Invalid promo code.');
    }
  };

  const handleCardNumberChange = (e: string) => {
    const clean = e.replace(/\D/g, '').substring(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: string) => {
    const clean = e.replace(/\D/g, '').substring(0, 4);
    if (clean.length > 2) {
      setCardExpiry(`${clean.substring(0, 2)}/${clean.substring(2, 4)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        toast.error('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter a valid CVV.');
        return;
      }
      if (!cardName.trim()) {
        toast.error('Please enter the cardholder name.');
        return;
      }
    } else if (method === 'upi') {
      if (!upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g. user@okhdfc).');
        return;
      }
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: method === 'card' ? 'Visa' : method === 'upi' ? 'UPI' : method === 'paypal' ? 'PayPal' : 'Net Banking',
          billingCycle: plan.billingCycle === 'yearly' ? 'Annual' : 'Monthly',
          amount: finalPrice,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Payment failed.');

      // Update local store subscription
      upgradeSubscription(plan.id === 'free' ? 'free' : 'premium');
      
      setSuccess(true);
      toast.success(`Subscribed successfully to Beato ${plan.name}! 💎`);
      
      // Delay closing modal to show success state
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16,
            background: 'rgba(26, 21, 18, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {/* Backdrop Click Dismiss */}
          <div 
            onClick={onClose} 
            style={{ position: 'absolute', inset: 0, zIndex: -1 }} 
          />

          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 15 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '480px',
              background: '#ffffff',
              borderRadius: isMobile ? '24px 24px 0 0' : 24,
              border: '1px solid rgba(43, 34, 26, 0.08)',
              boxShadow: '0 20px 50px rgba(43, 34, 26, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: isMobile ? '88vh' : '90vh',
              fontFamily: 'Inter, sans-serif',
              color: '#221a15',
            }}
          >
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, background: '#fbf9f5' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(43, 34, 26, 0.12)' }} />
              </div>
            )}
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(43, 34, 26, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fbf9f5',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15' }}>Secure Checkout</h3>
            <span style={{ fontSize: 11.5, color: '#87786c', fontWeight: 500 }}>Beato Premium Subscription</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(43, 34, 26, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#87786c',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            gap: 16
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              fontSize: 28
            }}>
              <Check size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 850, margin: '0 0 6px 0' }}>Payment Successful!</h4>
              <p style={{ color: '#87786c', fontSize: 13, margin: 0 }}>Welcome to Beato Premium. Enjoy ad-free listening.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Plan Invoice Details */}
            <div style={{ padding: '20px 24px', background: 'rgba(176, 136, 80, 0.05)', borderBottom: '1px solid rgba(43, 34, 26, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Beato {plan.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>${basePrice.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                  <span>Promo Discount (50%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#87786c', fontSize: 12.5, marginBottom: 12 }}>
                <span>GST / Taxes (18%)</span>
                <span>+${tax.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(43, 34, 26, 0.12)', paddingTop: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Total Amount</span>
                <span style={{ fontSize: 18, fontWeight: 950, color: 'var(--color-ss-secondary, #8c6c44)', fontFamily: 'Outfit, sans-serif' }}>${finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: 10, borderBottom: '1px solid rgba(43, 34, 26, 0.06)' }}>
              <input
                type="text"
                placeholder="Promo Code (Try WELCOMEBACK50)"
                value={promo}
                onChange={e => setPromo(e.target.value)}
                disabled={!!appliedCode}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(43, 34, 26, 0.12)',
                  background: appliedCode ? '#f4eede' : '#fff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={!!appliedCode || !promo.trim()}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: appliedCode ? '#10b981' : 'var(--color-ss-secondary, #8c6c44)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
              >
                {appliedCode ? 'Applied' : 'Apply'}
              </button>
            </div>

            {/* Payment Method Selector */}
            <div style={{ padding: '20px 24px 0px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 10 }}>Select Payment Method</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { id: 'card', label: 'Card', icon: <CreditCard size={15} /> },
                  { id: 'upi', label: 'UPI', icon: '📱' },
                  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
                  { id: 'netbanking', label: 'Bank', icon: '🏦' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMethod(p.id as any)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 4px',
                      borderRadius: 12,
                      border: method === p.id ? '2px solid var(--color-ss-secondary, #8c6c44)' : '1px solid rgba(43, 34, 26, 0.1)',
                      background: method === p.id ? 'rgba(176, 136, 80, 0.06)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields according to chosen Payment Method */}
            <div style={{ padding: '20px 24px' }}>
              {method === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 4 }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={e => handleCardNumberChange(e.target.value)}
                      maxLength={19}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(43, 34, 26, 0.12)',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 4 }}>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => handleCardExpiryChange(e.target.value)}
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(43, 34, 26, 0.12)',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 4 }}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(43, 34, 26, 0.12)',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 4 }}>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(43, 34, 26, 0.12)',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {method === 'upi' && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 4 }}>UPI VPA ID</label>
                  <input
                    type="text"
                    placeholder="e.g. username@okhdfc"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(43, 34, 26, 0.12)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: 10.5, color: '#87786c', marginTop: 4, display: 'block' }}>Enter your virtual payment address to request payment.</span>
                </div>
              )}

              {method === 'paypal' && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(0, 112, 186, 0.05)',
                  borderRadius: 12,
                  border: '1px solid rgba(0, 112, 186, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span style={{ fontSize: 24 }}>🅿️</span>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>PayPal Integration</h5>
                    <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#87786c' }}>You will be redirected to PayPal to complete this secure mock payment.</p>
                  </div>
                </div>
              )}

              {method === 'netbanking' && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 4 }}>Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={e => setSelectedBank(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(43, 34, 26, 0.12)',
                      fontSize: 13,
                      background: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="SBI">State Bank of India</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* Footer / Submit Button */}
            <div style={{
              padding: '16px 24px 24px',
              borderTop: '1px solid rgba(43, 34, 26, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <button
                type="submit"
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 14,
                  border: 'none',
                  background: 'var(--color-ss-secondary, #8c6c44)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14.5,
                  cursor: processing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(140, 108, 68, 0.25)',
                }}
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay $${finalPrice.toFixed(2)}`
                )}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#87786c', fontSize: 11 }}>
                <Shield size={12} />
                <span>SSL Secured & encrypted. All payments are sandbox test transactions.</span>
              </div>
            </div>

          </form>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
