'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, QrCode, User, Mail, Phone, CheckCircle, Package, Home, Wallet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export type PaymentMethodType = 'bank_transfer' | 'virtual_account_bca' | 'virtual_account_bri' | 'virtual_account_bni' | 'virtual_account_mandiri' | 'shopeepay' | 'gopay' | 'qris';
type ShippingMethod = 'cod' | 'delivery';

const OptionCard = ({ isSelected, onSelect, title, description, icon, disabled = false, badge = '' }: {
    isSelected: boolean;
    onSelect: () => void;
    title: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
    badge?: string;
}) => (
    <div
        onClick={!disabled ? onSelect : undefined}
        className={cn(
            "relative flex items-center gap-4 p-4 border rounded-lg transition-all duration-200",
            isSelected && "border-blue-500 bg-blue-50 ring-2 ring-blue-500",
            !disabled && "cursor-pointer hover:border-gray-400",
            disabled && "opacity-50 bg-gray-100 cursor-not-allowed"
        )}
    >
        {badge && <div className="absolute top-[-10px] right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{badge}</div>}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
            <p className="font-semibold text-gray-800">{title}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
    </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();

  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isBuyNow, setIsBuyNow] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('qris');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('cod');

  useEffect(() => {
    const buyNowItemString = sessionStorage.getItem('buyNowItem');
    if (buyNowItemString) {
        setCheckoutItems(JSON.parse(buyNowItemString));
        setIsBuyNow(true);
    } else {
        setCheckoutItems(cartState.items);
        setIsBuyNow(false);
    }
  }, [cartState.items]);

  const getTotalPrice = () => checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
        setError("Harap isi Nama, Email, dan Nomor WhatsApp.");
        setIsLoading(false);
        return;
    }
    if (shippingMethod === 'delivery' && !customerInfo.address) {
        setError("Harap isi alamat lengkap untuk pengiriman.");
        setIsLoading(false);
        return;
    }

    // --- PERUBAHAN DI SINI: Membersihkan data item sebelum dikirim ---
    const itemsForAPI = checkoutItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        selectedVariants: item.selectedVariants || {},
    }));
    // --- AKHIR PERUBAHAN ---

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsForAPI, // <-- Gunakan data yang sudah bersih
          customerInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: shippingMethod === 'delivery' ? customerInfo.address : 'COD Kampus UNAIR',
          },
          paymentMethod
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal membuat pesanan');

      if (isBuyNow) {
        sessionStorage.removeItem('buyNowItem');
      } else {
        clearCart();
      }

      router.push(`/pembayaran/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Selesaikan Pesanan Anda</h1>
                <p className="text-center text-gray-500 mb-8">Hanya beberapa langkah lagi untuk mendapatkan produk impianmu.</p>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
                        <Card className="shadow-md">
                            <CardHeader><CardTitle className="text-xl">1. Data Diri</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <Input placeholder="Nama Lengkap" value={customerInfo.name} onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))} required />
                                <Input type="email" placeholder="Alamat Email" value={customerInfo.email} onChange={(e) => setCustomerInfo(p => ({ ...p, email: e.target.value }))} required />
                                <Input type="tel" placeholder="Nomor WhatsApp (e.g. 0812...)" value={customerInfo.phone} onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} required />
                            </CardContent>
                        </Card>
                        <Card className="shadow-md">
                            <CardHeader><CardTitle className="text-xl">2. Metode Pengiriman</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <OptionCard isSelected={shippingMethod === 'cod'} onSelect={() => setShippingMethod('cod')} title="Ambil di Kampus UNAIR" description="Gratis. Detail lokasi & waktu akan diinfokan di grup." icon={<Package className="w-6 h-6" />} />
                                <OptionCard isSelected={shippingMethod === 'delivery'} onSelect={() => setShippingMethod('delivery')} title="Gratis Kirim ke Rumah" description="Khusus untuk area kota Surabaya." icon={<Home className="w-6 h-6" />} />
                                {shippingMethod === 'delivery' && (
                                    <div className="pt-2 animate-in fade-in-50">
                                        <Textarea placeholder="Alamat Lengkap Pengiriman (Jl, No, RT/RW, Kel, Kec, Kota, Kode Pos)" value={customerInfo.address} onChange={(e) => setCustomerInfo(p => ({...p, address: e.target.value}))} required/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-md">
                            <CardHeader><CardTitle className="text-xl">3. Metode Pembayaran</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <h4 className="font-semibold text-sm text-gray-600 pt-2">E-Wallet & QRIS</h4>
                                <OptionCard
                                    isSelected={paymentMethod === 'qris'}
                                    onSelect={() => setPaymentMethod('qris')}
                                    title="QRIS (Semua E-Wallet & M-Banking)"
                                    description="Scan dengan GoPay, ShopeePay, DANA, BCA, dll."
                                    icon={<Image src="/qris-logo.png" alt="QRIS" width={32} height={32} />}
                                    disabled={false}
                                />
                                <OptionCard isSelected={paymentMethod === 'shopeepay'} onSelect={() => setPaymentMethod('shopeepay')} title="ShopeePay" description="Transfer langsung ke sesama ShopeePay" icon={<Image src="/shopeepay.png" alt="ShopeePay" width={32} height={32} />} />
                                <OptionCard isSelected={paymentMethod === 'gopay'} onSelect={() => setPaymentMethod('gopay')} title="GoPay" description="Transfer langsung atau scan QRIS GoPay" icon={<Image src="/gopay.png" alt="GoPay" width={40} height={40} className="object-contain" />} />

                                <h4 className="font-semibold text-sm text-gray-600 pt-2">Transfer Bank</h4>
                                <OptionCard isSelected={paymentMethod === 'bank_transfer'} onSelect={() => setPaymentMethod('bank_transfer')} title="BCA (Bank Central Asia)" description="Bisa via M-Banking, ATM, atau E-Wallet" icon={<Image src="/bca.png" alt="BCA" width={40} height={40} className="object-contain" />} />

                                <h4 className="font-semibold text-sm text-gray-600 pt-2">Virtual Account (via ShopeePay)</h4>
                                <OptionCard isSelected={paymentMethod === 'virtual_account_bca'} onSelect={() => setPaymentMethod('virtual_account_bca')} title="BCA Virtual Account" description="Bayar ke VA ShopeePay" icon={<Image src="/bca.png" alt="BCA" width={40} height={40} className="object-contain" />} />
                                <OptionCard isSelected={paymentMethod === 'virtual_account_bri'} onSelect={() => setPaymentMethod('virtual_account_bri')} title="BRI Virtual Account" description="Bayar ke VA ShopeePay" icon={<Image src="/bri.png" alt="BRI" width={40} height={40} className="object-contain" />} />
                                <OptionCard isSelected={paymentMethod === 'virtual_account_bni'} onSelect={() => setPaymentMethod('virtual_account_bni')} title="BNI Virtual Account" description="Bayar ke VA ShopeePay" icon={<Image src="/bni.png" alt="BNI" width={40} height={40} className="object-contain" />} />
                                <OptionCard isSelected={paymentMethod === 'virtual_account_mandiri'} onSelect={() => setPaymentMethod('virtual_account_mandiri')} title="Mandiri Virtual Account" description="Bayar ke VA ShopeePay" icon={<Image src="/mandiri.png" alt="Mandiri" width={40} height={40} className="object-contain" />} />
                            </CardContent>
                        </Card>
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                        <Button type="submit" size="lg" className="w-full text-base font-bold" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Lanjut ke Pembayaran'}
                        </Button>
                    </form>

                    <div className="lg:col-span-2">
                        <Card className="sticky top-24 shadow-md">
                            <CardHeader><CardTitle>Ringkasan Belanja</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {checkoutItems.map((item) => (
                                            <div key={item.cartItemId || item.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden relative flex-shrink-0">
                                                        <Image src={item.image || ''} alt={item.name} layout="fill" className="object-cover"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-800 truncate">{item.name}</p>
                                                        <p className="text-gray-500">{item.quantity} x {formatPrice(item.price)}</p>
                                                    </div>
                                                </div>
                                                <p className="font-semibold pl-2">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <p className="text-gray-600">Subtotal</p>
                                            <p className="font-medium">{formatPrice(getTotalPrice())}</p>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <p className="text-gray-600">Ongkos Kirim</p>
                                            <p className="font-medium text-green-600">Gratis</p>
                                        </div>
                                        <div className="border-t my-2" />
                                        <div className="flex justify-between font-bold text-lg">
                                            <p>Total</p>
                                            <p>{formatPrice(getTotalPrice())}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}