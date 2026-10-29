'use client';

import React, { useState } from 'react';
import { FileText, Languages } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { hqDashboardData, ncDashboardData, ViewType } from '@/data/dashboardData';
import { useAuth } from '@/context/AuthContext';

const terms = {
  en: {
    title: 'BelleVie CRM – Terms & Conditions',
    subtitle: 'BelleVie Community Healthcare Service Network Center',
    sections: [
      { title: '1. Purpose', items: ['The BelleVie CRM system is designed to manage patient information, inquiries, appointments, medical documents, service requests, payments, and follow-up activities efficiently.'] },
      { title: '2. Patient Registration', items: ['Accurate and complete patient information must be recorded in the CRM.', 'Each patient must be assigned a unique Patient ID, where applicable.', 'Patient information must be updated whenever necessary.'] },
      { title: '3. Medical Records and Documents', items: ['Relevant medical reports, prescriptions, and other documents must be uploaded or recorded securely.', 'Documents must be linked to the correct patient profile.', 'Medical information must not be altered or shared without proper authorization.'] },
      { title: '4. Appointment and Consultation Management', items: ['All appointments, including online and video consultations, must be recorded in the CRM.', 'Appointment confirmations, cancellations, and rescheduling must be updated promptly.', 'Consultation arrangements are subject to doctor and service availability.'] },
      { title: '5. Patient Follow-up', items: ["All patient inquiries and follow-up activities must be documented.", "Staff must update the patient's current status, next follow-up date, and communication history.", 'Urgent cases must be escalated to the appropriate medical or operations team.'] },
      { title: '6. Payment and Billing', items: ['All service charges, payments, and outstanding balances must be recorded accurately.', 'Official receipts must be provided according to company policy.', 'Refunds and cancellations are subject to the applicable company refund policy.'] },
      { title: '7. Confidentiality and Data Protection', items: ['Patient information must remain confidential.', 'Access to the CRM must be restricted to authorized personnel.', 'Patient data must not be disclosed, copied, downloaded, or shared for unauthorized purposes.', 'All staff must comply with applicable data protection laws and company policies.'] },
      { title: '8. CRM Data Updates', items: ['All relevant patient interactions and operational updates must be recorded within 24 hours.', 'Staff must ensure that information is accurate, complete, and up to date.', 'Duplicate records and incorrect entries should be reported and corrected through authorized procedures.'] },
      { title: '9. Staff Responsibilities', items: ['Each staff member is responsible for maintaining the accuracy of their entries.', 'CRM login credentials must not be shared with unauthorized individuals.', 'Any suspected data breach, unauthorized access, or system issue must be reported immediately.'] },
      { title: '10. Limitation of Responsibility', items: ['The CRM is an administrative and patient-management tool. Recording information in the CRM does not replace professional medical judgment, clinical documentation requirements, or emergency medical services.'] },
      { title: '11. Policy Updates', items: ['BelleVie reserves the right to update these terms and conditions when necessary. Staff will be informed of relevant changes.'] },
    ],
  },
  bn: {
    title: 'BelleVie CRM – শর্তাবলি',
    subtitle: 'BelleVie Community Healthcare Service Network Center',
    sections: [
      { title: '১. উদ্দেশ্য', items: ['BelleVie CRM সিস্টেমটি রোগীর তথ্য, জিজ্ঞাসা, অ্যাপয়েন্টমেন্ট, চিকিৎসাসংক্রান্ত নথি, সেবার অনুরোধ, পেমেন্ট এবং পরবর্তী যোগাযোগ দক্ষতার সঙ্গে পরিচালনার জন্য তৈরি।'] },
      { title: '২. রোগী নিবন্ধন', items: ['CRM-এ রোগীর সঠিক ও সম্পূর্ণ তথ্য সংরক্ষণ করতে হবে।', 'প্রযোজ্য ক্ষেত্রে প্রত্যেক রোগীর জন্য একটি স্বতন্ত্র Patient ID দিতে হবে।', 'প্রয়োজন অনুযায়ী রোগীর তথ্য হালনাগাদ করতে হবে।'] },
      { title: '৩. চিকিৎসার নথি ও ডকুমেন্ট', items: ['প্রাসঙ্গিক মেডিকেল রিপোর্ট, প্রেসক্রিপশন এবং অন্যান্য নথি নিরাপদভাবে আপলোড বা সংরক্ষণ করতে হবে।', 'নথিগুলো সঠিক রোগীর প্রোফাইলে যুক্ত করতে হবে।', 'যথাযথ অনুমতি ছাড়া চিকিৎসাসংক্রান্ত তথ্য পরিবর্তন বা শেয়ার করা যাবে না।'] },
      { title: '৪. অ্যাপয়েন্টমেন্ট ও পরামর্শ পরিচালনা', items: ['অনলাইন ও ভিডিও পরামর্শসহ সব অ্যাপয়েন্টমেন্ট CRM-এ নথিভুক্ত করতে হবে।', 'অ্যাপয়েন্টমেন্ট নিশ্চিতকরণ, বাতিল বা সময় পরিবর্তনের তথ্য দ্রুত হালনাগাদ করতে হবে।', 'ডাক্তার ও সেবার প্রাপ্যতার ওপর পরামর্শের ব্যবস্থা নির্ভর করবে।'] },
      { title: '৫. রোগীর সঙ্গে পরবর্তী যোগাযোগ', items: ['রোগীর সব জিজ্ঞাসা এবং পরবর্তী যোগাযোগের তথ্য নথিভুক্ত করতে হবে।', 'কর্মীদের রোগীর বর্তমান অবস্থা, পরবর্তী যোগাযোগের তারিখ এবং যোগাযোগের ইতিহাস হালনাগাদ করতে হবে।', 'জরুরি বিষয় যথাযথ চিকিৎসা বা পরিচালনা দলের কাছে পাঠাতে হবে।'] },
      { title: '৬. পেমেন্ট ও বিলিং', items: ['সেবার সব চার্জ, পেমেন্ট এবং বকেয়া সঠিকভাবে নথিভুক্ত করতে হবে।', 'কোম্পানির নীতি অনুযায়ী অফিসিয়াল রসিদ দিতে হবে।', 'রিফান্ড ও বাতিলের ক্ষেত্রে প্রযোজ্য কোম্পানি রিফান্ড নীতি অনুসরণ করতে হবে।'] },
      { title: '৭. গোপনীয়তা ও তথ্য সুরক্ষা', items: ['রোগীর তথ্য গোপন রাখতে হবে।', 'CRM ব্যবহারের সুযোগ কেবল অনুমোদিত কর্মীদের মধ্যে সীমিত রাখতে হবে।', 'অননুমোদিত উদ্দেশ্যে রোগীর তথ্য প্রকাশ, কপি, ডাউনলোড বা শেয়ার করা যাবে না।', 'সব কর্মীকে প্রযোজ্য তথ্য সুরক্ষা আইন ও কোম্পানির নীতি মেনে চলতে হবে।'] },
      { title: '৮. CRM তথ্য হালনাগাদ', items: ['রোগীর সঙ্গে প্রাসঙ্গিক যোগাযোগ ও কার্যক্রমের তথ্য ২৪ ঘণ্টার মধ্যে CRM-এ লিখতে হবে।', 'তথ্য সঠিক, সম্পূর্ণ ও হালনাগাদ আছে তা কর্মীদের নিশ্চিত করতে হবে।', 'একাধিকবার তৈরি হওয়া রেকর্ড বা ভুল তথ্য জানাতে হবে এবং অনুমোদিত প্রক্রিয়ায় সংশোধন করতে হবে।'] },
      { title: '৯. কর্মীদের দায়িত্ব', items: ['নিজের এন্ট্রির সঠিকতা বজায় রাখার দায়িত্ব প্রত্যেক কর্মীর।', 'অননুমোদিত কারও সঙ্গে CRM লগইন তথ্য শেয়ার করা যাবে না।', 'তথ্য ফাঁস, অননুমোদিত প্রবেশ বা সিস্টেমের সমস্যা সন্দেহ হলে সঙ্গে সঙ্গে জানাতে হবে।'] },
      { title: '১০. দায়বদ্ধতার সীমা', items: ['CRM একটি প্রশাসনিক ও রোগী-ব্যবস্থাপনার সরঞ্জাম। CRM-এ তথ্য লেখা পেশাদার চিকিৎসকের সিদ্ধান্ত, ক্লিনিক্যাল নথির বাধ্যবাধকতা বা জরুরি চিকিৎসাসেবার বিকল্প নয়।'] },
      { title: '১১. নীতিমালা হালনাগাদ', items: ['প্রয়োজনে BelleVie এই শর্তাবলি হালনাগাদ করার অধিকার রাখে। প্রাসঙ্গিক পরিবর্তনগুলো কর্মীদের জানানো হবে।'] },
    ],
  },
};

export default function TermsAndConditionsPage() {
  const { user } = useAuth();
  const currentView: ViewType = user?.role === 'NC' ? 'NC' : 'HQ';
  const config = currentView === 'NC' ? ncDashboardData : hqDashboardData;
  const [collapsed, setCollapsed] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const content = terms[language];

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900 overflow-hidden">
      <Sidebar currentView={currentView} collapsed={collapsed} activeItem="Terms and Conditions" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header config={config} currentView={currentView} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><FileText className="h-6 w-6" /></div>
                <div><h1 className="text-xl font-bold text-slate-900">{content.title}</h1><p className="mt-1 text-sm text-slate-500">{content.subtitle}</p></div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Select language">
                <Languages className="ml-2 h-4 w-4 text-slate-500" />
                <button onClick={() => setLanguage('en')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`} aria-pressed={language === 'en'}>English</button>
                <button onClick={() => setLanguage('bn')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${language === 'bn' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`} aria-pressed={language === 'bn'}>বাংলা</button>
              </div>
            </div>
            <div className="space-y-4">
              {content.sections.map((section) => (
                <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}