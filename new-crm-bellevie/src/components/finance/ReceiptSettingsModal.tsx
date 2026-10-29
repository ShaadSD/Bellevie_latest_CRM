'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Sliders, CheckCircle2, RotateCcw, Building2, Phone, Mail, Globe, PenTool, Sparkles } from 'lucide-react';
import { ReceiptSetting, DEFAULT_RECEIPT_SETTINGS, updateReceiptSettings } from '@/lib/financeApi';

interface ReceiptSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReceiptSetting;
  onSettingsUpdated: (updated: ReceiptSetting) => void;
}

export const ReceiptSettingsModal: React.FC<ReceiptSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<ReceiptSetting>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen || !mounted) return null;

  const handleChange = (field: keyof ReceiptSetting, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleResetToDefault = () => {
    setFormData({ ...DEFAULT_RECEIPT_SETTINGS });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const res = await updateReceiptSettings(formData);
      if (res) {
        onSettingsUpdated(res);
        setSuccessMsg('Receipt settings saved successfully!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        // Fallback local update if API had warning
        onSettingsUpdated(formData);
        setSuccessMsg('Settings updated locally!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to save receipt settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Receipt Default Configuration</h3>
              <p className="text-xs text-slate-500">HQ settings for official payment receipts & PDF layout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Brand & Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Brand & Header Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="BelleVie"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sub-Title / Suffix</label>
                <input
                  type="text"
                  value={formData.sub_title}
                  onChange={(e) => handleChange('sub_title', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="GLOBAL HEALTH"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="CARE BEYOND BORDERS"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>HQ Contact Details (Header Top Right)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Default Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="+880 1234 567890"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Support Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="info@bellevieglobalhealth.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" /> Website URL
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="www.bellevieglobalhealth.com"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Signatory & Footer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
              <PenTool className="w-4 h-4 text-purple-600" />
              <span>Signatory & Receipt Footer</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Signatory Title</label>
                <input
                  type="text"
                  value={formData.signatory_title}
                  onChange={(e) => handleChange('signatory_title', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Authorized Signatory"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Signatory Organization</label>
                <input
                  type="text"
                  value={formData.signatory_org}
                  onChange={(e) => handleChange('signatory_org', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="BelleVie Global Health"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Footer Slogan 1</label>
                <input
                  type="text"
                  value={formData.footer_slogan_title}
                  onChange={(e) => handleChange('footer_slogan_title', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Healthy People"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Footer Slogan 2</label>
                <input
                  type="text"
                  value={formData.footer_slogan_subtitle}
                  onChange={(e) => handleChange('footer_slogan_subtitle', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Brighter Tomorrow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Footer Message</label>
                <input
                  type="text"
                  value={formData.footer_thank_you}
                  onChange={(e) => handleChange('footer_thank_you', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Thank you for choosing"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Footer Brand Highlight</label>
                <input
                  type="text"
                  value={formData.footer_thank_you_bold}
                  onChange={(e) => handleChange('footer_thank_you_bold', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="BelleVie Global Health"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl border border-slate-200 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
