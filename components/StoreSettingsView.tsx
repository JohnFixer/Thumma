

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { StoreSettings } from '../types';
import type { TranslationKey } from '../translations';
import { Cog6ToothIcon, PhotoIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import { supabase } from '../lib/supabaseClient';

interface StoreSettingsViewProps {
    storeSettings: StoreSettings | null;
    onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
    showAlert: (title: string, message: string) => void;
    t: (key: TranslationKey) => string;
}

const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({ storeSettings, onUpdateSettings, showAlert, t }) => {
    const [name, setName] = useState({ en: '', th: '' });
    const [address, setAddress] = useState({ en: '', th: '' });
    const [phone, setPhone] = useState({ en: '', th: '' });
    const [taxId, setTaxId] = useState({ en: '', th: '' });
    const [logoUrl, setLogoUrl] = useState('');
    const [defaultOutsourceMarkup, setDefaultOutsourceMarkup] = useState<number | ''>(20);
    const [deliveryRatePerKm, setDeliveryRatePerKm] = useState<number | ''>(10);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (storeSettings) {
            setName(storeSettings.store_name || { en: '', th: '' });
            setAddress(storeSettings.address || { en: '', th: '' });
            setPhone(storeSettings.phone || { en: '', th: '' });
            setTaxId(storeSettings.tax_id || { en: '', th: '' });
            setLogoUrl(storeSettings.logo_url || '');
            setDefaultOutsourceMarkup(storeSettings.default_outsource_markup ?? 20);
            setDeliveryRatePerKm(storeSettings.delivery_rate_per_km ?? 10);
        }
    }, [storeSettings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ 
            store_name: name,
            address,
            phone,
            tax_id: taxId,
            logo_url: logoUrl,
            default_outsource_markup: Number(defaultOutsourceMarkup),
            delivery_rate_per_km: Number(deliveryRatePerKm),
        });
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
        const { data, error } = await supabase.storage
            .from('store-assets')
            .upload(fileName, file);

        if (error) {
            showAlert('Upload Error', `Failed to upload logo: ${error.message}. Please ensure you have created a public 'store-assets' bucket with insert permissions.`);
            console.error('Logo upload error:', error);
            setIsUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('store-assets')
            .getPublicUrl(fileName);
        
        setLogoUrl(publicUrl);
        setIsUploading(false);
    }, [showAlert]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/gif': ['.gif'] },
        maxFiles: 1,
        multiple: false,
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-surface rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Cog6ToothIcon className="h-6 w-6" />
                        Store Settings
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">Manage your store's branding, contact information, and documentation details.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-8">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <h3 className="font-semibold text-text-primary">Store Logo</h3>
                                <p className="text-xs text-text-secondary">Upload your company logo. This will appear in the sidebar.</p>
                            </div>
                            <div className="md:col-span-2">
                                <div {...getRootProps()} className={`flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'}`}>
                                    <input {...getInputProps()} />
                                    {isUploading ? (
                                        <p>Uploading...</p>
                                    ) : logoUrl ? (
                                        <img src={logoUrl} alt="Logo preview" className="max-h-24" />
                                    ) : (
                                        <div className="text-center">
                                            <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-gray-400" />
                                            <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-2">Click the image or drop a new file to replace.</p>
                            </div>
                        </div>

                        <div className="border-t"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <h3 className="font-semibold text-text-primary">Store Information</h3>
                                <p className="text-xs text-text-secondary">Used for receipts and delivery notes. Provide both English and Thai versions.</p>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary">Store Name (EN)</label>
                                        <input type="text" value={name.en} onChange={(e) => setName(p => ({...p, en: e.target.value}))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary">Store Name (TH)</label>
                                        <input type="text" value={name.th} onChange={(e) => setName(p => ({...p, th: e.target.value}))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Tax ID</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="English (Optional)" value={taxId.en} onChange={(e) => setTaxId(p => ({...p, en: e.target.value}))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"/>
                                        <input type="text" placeholder="Thai" value={taxId.th} onChange={(e) => setTaxId(p => ({...p, th: e.target.value}))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"/>
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-text-secondary">Phone Number</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="tel" placeholder="English (Optional)" value={phone.en} onChange={(e) => setPhone(p => ({...p, en: e.target.value}))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"/>
                                        <input type="tel" placeholder="Thai" value={phone.th} onChange={(e) => setPhone(p => ({...p, th: e.target.value}))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Address</label>
                                    <textarea placeholder="English Address" value={address.en} onChange={(e) => setAddress(p => ({...p, en: e.target.value}))} rows={2} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" />
                                    <textarea placeholder="Thai Address" value={address.th} onChange={(e) => setAddress(p => ({...p, th: e.target.value}))} rows={2} className="mt-2 block w-full rounded-md p-2 bg-background border-gray-300" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <h3 className="font-semibold text-text-primary">Outsource Settings</h3>
                                <p className="text-xs text-text-secondary">Set the default price markup for items bought from external suppliers.</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-secondary">Default Markup Percentage (%)</label>
                                <input 
                                    type="number" 
                                    value={defaultOutsourceMarkup} 
                                    onChange={(e) => setDefaultOutsourceMarkup(e.target.value === '' ? '' : Number(e.target.value))} 
                                    className="mt-1 block w-full max-w-xs rounded-md p-2 bg-background border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="border-t"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <h3 className="font-semibold text-text-primary">Delivery Settings</h3>
                                <p className="text-xs text-text-secondary">Set the default rate for distance-based delivery fees.</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-secondary">{t('default_delivery_rate')} (฿)</label>
                                <input 
                                    type="number" 
                                    value={deliveryRatePerKm} 
                                    onChange={(e) => setDeliveryRatePerKm(e.target.value === '' ? '' : Number(e.target.value))} 
                                    className="mt-1 block w-full max-w-xs rounded-md p-2 bg-background border-gray-300"
                                />
                            </div>
                        </div>

                    </div>
                    <div className="bg-background px-6 py-4 flex justify-end rounded-b-lg">
                        <button type="submit" className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800">
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StoreSettingsView;