'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Member } from '@/data/membersData';
import { BASE_URL } from '@/lib/api';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Edit3,
  ShieldCheck,
  Droplet,
  AlertTriangle,
  HeartPulse,
  Calendar,
  User,
  Phone,
  MapPin,
  Stethoscope,
  TestTube,
  Home,
  Truck,
  Building2,
  Plane,
  FileText,
  Eye,
  FolderOpen,
  ClipboardList,
  FileCheck,
  Loader2,
  Plus,
  Upload,
  X,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  fetchDigitalTwinOverview,
  addDigitalTwinFinancialRecord,
  fetchDigitalTwinHistory,
  fetchDigitalTwinEMR,
  fetchDigitalTwinDocuments,
  createDigitalTwinEMRRecord,
  uploadDigitalTwinDocument,
  DigitalTwinOverviewResponse,
  TimelineEvent,
  EMRRecord,
  MedicalDocItem
} from '@/lib/digitalHealthTwinApi';

interface DigitalHealthTwinViewProps {
  member: Member;
  onBack: () => void;
}

export const DigitalHealthTwinView: React.FC<DigitalHealthTwinViewProps> = ({
  member,
  onBack,
}) => {
  const [timelineFilter, setTimelineFilter] = useState('All Services');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Backend Data States
  const [overviewData, setOverviewData] = useState<DigitalTwinOverviewResponse | null>(null);
  const [timelineList, setTimelineList] = useState<TimelineEvent[]>([]);
  const [emrRecords, setEmrRecords] = useState<EMRRecord[]>([]);
  const [documentsList, setDocumentsList] = useState<MedicalDocItem[]>([]);

  // Add EMR Record Modal & 7 Category Form States
  const [isAddEmrOpen, setIsAddEmrOpen] = useState(false);
  const [addEmrCategory, setAddEmrCategory] = useState<string>('CONSULTATION');
  const [isSubmittingEmr, setIsSubmittingEmr] = useState(false);

  // 1. Consultations Form State
  const [consultDateTime, setConsultDateTime] = useState('');
  const [consultDoctor, setConsultDoctor] = useState('');
  const [consultHospital, setConsultHospital] = useState('');
  const [consultType, setConsultType] = useState('In-person');
  const [consultChiefComplaint, setConsultChiefComplaint] = useState('');
  const [consultSymptoms, setConsultSymptoms] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [consultAdvice, setConsultAdvice] = useState('');
  const [consultFollowUp, setConsultFollowUp] = useState('');

  // 2. Diagnoses Form State
  const [diagName, setDiagName] = useState('');
  const [diagCode, setDiagCode] = useState('');
  const [diagDate, setDiagDate] = useState('');
  const [diagType, setDiagType] = useState('Confirmed');
  const [diagSeverity, setDiagSeverity] = useState('Moderate');
  const [diagDoctor, setDiagDoctor] = useState('');
  const [diagNotes, setDiagNotes] = useState('');
  const [diagEvidence, setDiagEvidence] = useState('');

  // 3. Prescriptions Form State
  const [rxDate, setRxDate] = useState('');
  const [rxDoctor, setRxDoctor] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxItems, setRxItems] = useState<Array<{
    medication_name: string;
    strength: string;
    dosage: string;
    route: string;
    frequency: string;
    duration: string;
    quantity: string;
  }>>([
    { medication_name: '', strength: '', dosage: '1 tablet', route: 'Oral', frequency: 'Twice daily', duration: '5 days', quantity: '' }
  ]);

  // 4. Medications Form State
  const [medName, setMedName] = useState('');
  const [medStrength, setMedStrength] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medRoute, setMedRoute] = useState('Oral');
  const [medFrequency, setMedFrequency] = useState('');
  const [medStartDate, setMedStartDate] = useState('');
  const [medEndDate, setMedEndDate] = useState('');
  const [medStatus, setMedStatus] = useState('Active');
  const [medDoctor, setMedDoctor] = useState('');
  const [medNotes, setMedNotes] = useState('');

  // 5. Allergies Form State
  const [allergenType, setAllergenType] = useState('Medicine');
  const [allergenName, setAllergenName] = useState('');
  const [allergyReaction, setAllergyReaction] = useState('');
  const [allergySeverity, setAllergySeverity] = useState('Moderate');
  const [allergyObservedDate, setAllergyObservedDate] = useState('');
  const [allergyStatus, setAllergyStatus] = useState('Active');
  const [allergyVerifiedBy, setAllergyVerifiedBy] = useState('');
  const [allergyNotes, setAllergyNotes] = useState('');

  // 6. Medical History Form State
  const [histType, setHistType] = useState('Disease');
  const [histCondition, setHistCondition] = useState('');
  const [histDescription, setHistDescription] = useState('');
  const [histOnset, setHistOnset] = useState('');
  const [histEnd, setHistEnd] = useState('');
  const [histStatus, setHistStatus] = useState('Ongoing');
  const [histTreatment, setHistTreatment] = useState('');
  const [histProvider, setHistProvider] = useState('');
  const [histSource, setHistSource] = useState('Patient');

  // 7. Diagnostic Reports Form State
  const [testName, setTestName] = useState('');
  const [testCategory, setTestCategory] = useState('Blood');
  const [testDate, setTestDate] = useState('');
  const [testLab, setTestLab] = useState('');
  const [testSummary, setTestSummary] = useState('');
  const [testValue, setTestValue] = useState('');
  const [testUnit, setTestUnit] = useState('');
  const [testRefRange, setTestRefRange] = useState('');
  const [testAbnormalFlag, setTestAbnormalFlag] = useState('Normal');
  const [testReportedBy, setTestReportedBy] = useState('');
  const [testVerificationStatus, setTestVerificationStatus] = useState('Verified');

  // Common System Fields State
  const [commonSourceType, setCommonSourceType] = useState('Manual Entry');
  const [commonRecordStatus, setCommonRecordStatus] = useState('Verified');
  const [commonNotes, setCommonNotes] = useState('');

  // EMR Records View Drawer State
  const [isEmrDrawerOpen, setIsEmrDrawerOpen] = useState(false);
  const [selectedEmrCategory, setSelectedEmrCategory] = useState<string>('ALL');
  const [emrSearchQuery, setEmrSearchQuery] = useState('');

  // Upload Medical Document Modal State
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('LAB_REPORT');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Documents Drawer State
  const [isDocsDrawerOpen, setIsDocsDrawerOpen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Detail View Modal States
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | null>(null);
  const [selectedEmrRecord, setSelectedEmrRecord] = useState<EMRRecord | null>(null);

  // Helper to reliably retrieve member identifier (uses numeric ID first for exact DB match)
  const getIdentifier = useCallback(() => {
    return member.id || (member as any).public_id || member.memberId;
  }, [member]);

  // Toast notification timer
  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load API data from backend
  const loadBackendData = useCallback(async () => {
    setIsLoading(true);
    const identifier = getIdentifier();
    try {
      const [overviewRes, historyRes, emrRes, docRes] = await Promise.all([
        fetchDigitalTwinOverview(identifier).catch((err) => {
          console.error('Overview API error:', err);
          return null;
        }),
        fetchDigitalTwinHistory(identifier).catch((err) => {
          console.error('History API error:', err);
          return null;
        }),
        fetchDigitalTwinEMR(identifier).catch((err) => {
          console.error('EMR API error:', err);
          return null;
        }),
        fetchDigitalTwinDocuments(identifier).catch((err) => {
          console.error('Documents API error:', err);
          return null;
        }),
      ]);

      if (overviewRes) setOverviewData(overviewRes);
      if (historyRes && Array.isArray(historyRes.results)) setTimelineList(historyRes.results);
      if (emrRes && Array.isArray(emrRes.results)) setEmrRecords(emrRes.results);
      if (docRes && Array.isArray(docRes.results)) setDocumentsList(docRes.results);
    } catch (err) {
      console.warn('Digital Twin API fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getIdentifier]);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Real Profile & Health Data from Backend
  const profile = overviewData?.member;
  const healthProfile = overviewData?.member?.health_profile || overviewData?.health_summary?.health_profile;
  const activePlan = overviewData?.health_summary?.active_plan;
  const planHistory = overviewData?.health_summary?.plan_history || [];
  const financialSummary = overviewData?.health_summary?.financial_summary;
  const benefitSummary = overviewData?.health_summary?.benefit_summary || [];
  const paymentHistory = overviewData?.health_summary?.payment_history || [];
  const claimHistory = overviewData?.health_summary?.claim_history || [];
  const money = (value: number | string | null | undefined) => `৳${Number(value || 0).toLocaleString()}`;
  const addFinancialRecord = async (type: 'payment' | 'claim') => {
    const firstSubscription = planHistory[0];
    if (!firstSubscription) return setNotification({ type: 'error', message: 'No subscription found for this member.' });
    const amount = window.prompt(type === 'payment' ? 'Payment amount:' : 'Claim amount:');
    if (!amount) return;
    const data: Record<string, unknown> = { type, subscription: firstSubscription.id, amount, claim_amount: amount, status: type === 'payment' ? 'VERIFIED' : 'APPROVED' };
    if (type === 'claim') {
      const benefitId = window.prompt(`Benefit ID (${benefitSummary.map(b => `${b.benefit_id}: ${b.name}`).join(', ')}):`);
      if (!benefitId) return;
      data.benefit = benefitId;
      data.approved_amount = window.prompt('Approved amount:', amount) || amount;
    } else {
      data.payment_date = new Date().toISOString().slice(0, 10);
      data.payment_method = window.prompt('Payment method:') || '';
      data.transaction_id = window.prompt('Transaction ID:') || '';
    }
    try {
      await addDigitalTwinFinancialRecord(memberId, data);
      await loadBackendData();
      setNotification({ type: 'success', message: `${type === 'payment' ? 'Payment' : 'Benefit claim'} added successfully.` });
    } catch (error: any) {
      setNotification({ type: 'error', message: error?.message || 'Could not save financial record.' });
    }
  };

  const memberName = profile?.full_name || member.name || 'Member';
  const memberId = profile?.public_id || member.memberId || `BV-${member.id}`;
  const memberGender = profile?.gender ? (profile.gender === 'FEMALE' ? 'Female' : 'Male') : (member.gender || 'Male');
  const memberPhone = profile?.phone || (member.phone !== '-' ? member.phone : 'Not recorded');
  const memberEmail = profile?.email || (member.email !== '-' ? member.email : 'Not recorded');
  const memberAddress = profile?.address || (member.address && member.address !== '-' ? member.address : 'Not recorded');
  const memberCentre = profile?.assigned_centre_name || member.centre || 'HQ';
  const memberAge = profile?.age !== null && profile?.age !== undefined ? profile.age : null;

  // Real Health Profile fields
  const bloodGroup = healthProfile?.blood_group || 'Not recorded';
  const allergies = healthProfile?.allergies || 'Not recorded';
  const chronicConditions = healthProfile?.chronic_conditions || 'Not recorded';
  const primaryPhysician = healthProfile?.primary_physician || 'Not recorded';
  
  const emergencyContactName = healthProfile?.emergency_contact_name;
  const emergencyContactPhone = healthProfile?.emergency_contact_phone;
  const emergencyContactText = emergencyContactName
    ? `${emergencyContactName}${emergencyContactPhone ? ` (${emergencyContactPhone})` : ''}`
    : 'Not recorded';

  // Timeline icon mapping
  const getTimelineIcon = (eventType: string) => {
    switch (eventType?.toUpperCase()) {
      case 'DOCTOR':
      case 'CONSULTATION':
      case 'DOCTOR_CONSULTATION':
        return { icon: Stethoscope, bg: 'bg-blue-100 text-blue-600' };
      case 'DIAGNOSTIC':
      case 'DIAGNOSTIC_TEST':
      case 'DIAGNOSTIC_REPORT':
        return { icon: TestTube, bg: 'bg-emerald-100 text-emerald-600' };
      case 'HOMECARE':
        return { icon: Home, bg: 'bg-amber-100 text-amber-600' };
      case 'AMBULANCE':
        return { icon: Truck, bg: 'bg-purple-100 text-purple-600' };
      case 'HOSPITALIZATION':
        return { icon: Building2, bg: 'bg-rose-100 text-rose-600' };
      case 'FOREIGN_TREATMENT':
        return { icon: Plane, bg: 'bg-sky-100 text-sky-600' };
      case 'PRESCRIPTION':
      case 'MEDICATION':
      case 'DIAGNOSIS':
      case 'MEDICAL_HISTORY':
      case 'ALLERGY':
        return { icon: ClipboardList, bg: 'bg-indigo-100 text-indigo-600' };
      case 'MEDICAL_DOCUMENT':
        return { icon: FileText, bg: 'bg-teal-100 text-teal-600' };
      default:
        return { icon: FileCheck, bg: 'bg-slate-100 text-slate-700' };
    }
  };

  // Status Badge Styling Helper
  const getStatusBadgeColor = (status?: string, statusDisplay?: string) => {
    const s = (statusDisplay || status || '').toUpperCase();
    if (
      s.includes('COMPLETED') ||
      s.includes('RECORDED') ||
      s.includes('CONFIRMED') ||
      s.includes('APPROVED') ||
      s.includes('RESOLVED') ||
      s.includes('CLOSED') ||
      s.includes('UPLOADED') ||
      s.includes('PAID')
    ) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (
      s.includes('PENDING') ||
      s.includes('SCHEDULED') ||
      s.includes('REQUESTED') ||
      s.includes('UNDER_REVIEW') ||
      s.includes('SUBMITTED') ||
      s.includes('UNPAID')
    ) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (
      s.includes('IN_PROGRESS') ||
      s.includes('ASSIGNED') ||
      s.includes('DISPATCHED') ||
      s.includes('ACCEPTED') ||
      s.includes('ACTIVE') ||
      s.includes('PROCESSING')
    ) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (
      s.includes('CANCELLED') ||
      s.includes('REJECTED') ||
      s.includes('EXPIRED') ||
      s.includes('FAILED')
    ) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Document URL builder helper
  const getDocFileUrl = (doc: MedicalDocItem) => {
    if (!doc) return '#';
    if (doc.file) {
      if (doc.file.startsWith('http://') || doc.file.startsWith('https://')) {
        return doc.file;
      }
      const cleanPath = doc.file.startsWith('/') ? doc.file : `/${doc.file}`;
      return `${BASE_URL}${cleanPath}`;
    }
    if (doc.public_id) {
      return `${BASE_URL}/api/digital-health-twin/documents/${doc.public_id}/download/`;
    }
    return '#';
  };

  // Filtered timeline based on dropdown selection

  const filteredTimeline = timelineList.filter((item) => {
    if (timelineFilter === 'All Services') return true;
    const evType = item.event_type?.toUpperCase() || '';
    const srcMod = item.source_module?.toUpperCase() || '';
    if (timelineFilter === 'Consultations') return evType.includes('CONSULTATION') || evType.includes('DOCTOR') || evType.includes('TELEMEDICINE');
    if (timelineFilter === 'Diagnostics') return evType.includes('DIAGNOSTIC');
    if (timelineFilter === 'Foreign Treatment') return evType.includes('FOREIGN') || srcMod.includes('FOREIGN');
    if (timelineFilter === 'Home Care') return evType.includes('HOMECARE') || srcMod.includes('HOMECARE');
    if (timelineFilter === 'Hospitalization') return evType.includes('HOSPITAL') || srcMod.includes('HOSPITAL');
    if (timelineFilter === 'Ambulance') return evType.includes('AMBULANCE') || srcMod.includes('AMBULANCE');
    if (timelineFilter === 'Cases') return evType.includes('CASE') || srcMod.includes('CASE');
    if (timelineFilter === 'Clinical Records') return srcMod.includes('DIGITAL_HEALTH_TWIN') || evType.includes('RECORD') || evType.includes('MEDICAL_DOCUMENT');
    return true;
  });


  // Real EMR Category list calculation
  const getEmrCount = (catKey: string) => {
    const count = emrRecords.filter((r) => r.category === catKey).length;
    return count;
  };

  const emrCategories = [
    { key: 'CONSULTATION', name: 'Consultations', count: getEmrCount('CONSULTATION'), icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
    { key: 'DIAGNOSIS', name: 'Diagnoses', count: getEmrCount('DIAGNOSIS'), icon: FileText, color: 'text-slate-600 bg-slate-100' },
    { key: 'PRESCRIPTION', name: 'Prescriptions', count: getEmrCount('PRESCRIPTION'), icon: FileCheck, color: 'text-rose-600 bg-rose-50' },
    { key: 'MEDICATION', name: 'Medications', count: getEmrCount('MEDICATION'), icon: HeartPulse, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'ALLERGY', name: 'Allergies', count: getEmrCount('ALLERGY'), icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { key: 'MEDICAL_HISTORY', name: 'Medical History', count: getEmrCount('MEDICAL_HISTORY'), icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50' },
    { key: 'DIAGNOSTIC_REPORT', name: 'Diagnostic Reports', count: getEmrCount('DIAGNOSTIC_REPORT'), icon: TestTube, color: 'text-cyan-600 bg-cyan-50' },
  ];

  // Helpers for Prescription Items array
  const handleAddRxItem = () => {
    setRxItems(prev => [
      ...prev,
      { medication_name: '', strength: '', dosage: '1 tablet', route: 'Oral', frequency: 'Twice daily', duration: '5 days', quantity: '' }
    ]);
  };

  const handleRemoveRxItem = (index: number) => {
    if (rxItems.length <= 1) return;
    setRxItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRxItemChange = (index: number, field: string, value: string) => {
    setRxItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Reset Form
  const resetAddEmrForm = () => {
    setConsultDateTime('');
    setConsultDoctor('');
    setConsultHospital('');
    setConsultType('In-person');
    setConsultChiefComplaint('');
    setConsultSymptoms('');
    setConsultNotes('');
    setConsultAdvice('');
    setConsultFollowUp('');

    setDiagName('');
    setDiagCode('');
    setDiagDate('');
    setDiagType('Confirmed');
    setDiagSeverity('Moderate');
    setDiagDoctor('');
    setDiagNotes('');
    setDiagEvidence('');

    setRxDate('');
    setRxDoctor('');
    setRxInstructions('');
    setRxItems([{ medication_name: '', strength: '', dosage: '1 tablet', route: 'Oral', frequency: 'Twice daily', duration: '5 days', quantity: '' }]);

    setMedName('');
    setMedStrength('');
    setMedDosage('');
    setMedRoute('Oral');
    setMedFrequency('');
    setMedStartDate('');
    setMedEndDate('');
    setMedStatus('Active');
    setMedDoctor('');
    setMedNotes('');

    setAllergenType('Medicine');
    setAllergenName('');
    setAllergyReaction('');
    setAllergySeverity('Moderate');
    setAllergyObservedDate('');
    setAllergyStatus('Active');
    setAllergyVerifiedBy('');
    setAllergyNotes('');

    setHistType('Disease');
    setHistCondition('');
    setHistDescription('');
    setHistOnset('');
    setHistEnd('');
    setHistStatus('Ongoing');
    setHistTreatment('');
    setHistProvider('');
    setHistSource('Patient');

    setTestName('');
    setTestCategory('Blood');
    setTestDate('');
    setTestLab('');
    setTestSummary('');
    setTestValue('');
    setTestUnit('');
    setTestRefRange('');
    setTestAbnormalFlag('Normal');
    setTestReportedBy('');
    setTestVerificationStatus('Verified');

    setCommonSourceType('Manual Entry');
    setCommonRecordStatus('Verified');
    setCommonNotes('');
  };

  // Handle Add EMR Record submit across all 7 Categories
  const handleAddEmrRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEmr(true);

    try {
      const identifier = getIdentifier();
      let recordTitle = '';
      let recordDoctor = '';
      let recordInstitution = '';
      let recordDate = '';
      let recordDesc = '';
      let categoryMetadata: Record<string, any> = {
        source_type: commonSourceType,
        record_status: commonRecordStatus,
        admin_notes: commonNotes || undefined,
      };

      if (addEmrCategory === 'CONSULTATION') {
        if (!consultDoctor || !consultChiefComplaint || !consultDateTime) {
          showToast('error', 'Consultation Date/Time, Doctor name, and Chief complaint are required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = `Consultation - ${consultChiefComplaint.substring(0, 45)}`;
        recordDoctor = consultDoctor;
        recordInstitution = consultHospital;
        recordDate = consultDateTime;
        recordDesc = consultChiefComplaint;
        categoryMetadata = {
          ...categoryMetadata,
          consultation_type: consultType,
          chief_complaint: consultChiefComplaint,
          symptoms: consultSymptoms || undefined,
          clinical_notes: consultNotes || undefined,
          advice_treatment_plan: consultAdvice || undefined,
          follow_up_date: consultFollowUp || undefined,
        };
      } else if (addEmrCategory === 'DIAGNOSIS') {
        if (!diagName || !diagDoctor || !diagDate || !diagType) {
          showToast('error', 'Diagnosis Name, Diagnosis Date, Diagnosed By, and Diagnosis Type are required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = diagName;
        recordDoctor = diagDoctor;
        recordDate = diagDate;
        recordDesc = diagNotes || `Diagnosis: ${diagName} (${diagType})`;
        categoryMetadata = {
          ...categoryMetadata,
          diagnosis_name: diagName,
          diagnosis_code: diagCode || undefined,
          diagnosis_type: diagType,
          severity: diagSeverity,
          diagnosed_by: diagDoctor,
          source_evidence: diagEvidence || undefined,
          clinical_notes: diagNotes || undefined,
        };
      } else if (addEmrCategory === 'PRESCRIPTION') {
        if (!rxDoctor || !rxDate) {
          showToast('error', 'Prescription Date and Prescribed By doctor are required.');
          setIsSubmittingEmr(false);
          return;
        }
        const validItems = rxItems.filter(i => i.medication_name.trim() !== '');
        if (validItems.length === 0) {
          showToast('error', 'At least one prescribed medication with a name is required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = `Prescription by ${rxDoctor}`;
        recordDoctor = rxDoctor;
        recordDate = rxDate;
        recordDesc = rxInstructions || `Prescription containing ${validItems.length} medication item(s).`;
        categoryMetadata = {
          ...categoryMetadata,
          prescribed_by: rxDoctor,
          prescription_date: rxDate,
          prescription_items: validItems,
          instructions: rxInstructions || undefined,
        };
      } else if (addEmrCategory === 'MEDICATION') {
        if (!medName || !medStatus) {
          showToast('error', 'Medication Name and Medication Status are required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = medName;
        recordDoctor = medDoctor;
        recordDate = medStartDate || new Date().toISOString();
        recordDesc = medNotes || `Medication: ${medName} (${medStatus})`;
        categoryMetadata = {
          ...categoryMetadata,
          medication_name: medName,
          strength: medStrength || undefined,
          dosage: medDosage || undefined,
          route: medRoute || undefined,
          frequency: medFrequency || undefined,
          start_date: medStartDate || undefined,
          end_date: medEndDate || undefined,
          medication_status: medStatus,
          prescribing_doctor: medDoctor || undefined,
          notes: medNotes || undefined,
        };
      } else if (addEmrCategory === 'ALLERGY') {
        if (!allergenName || !allergenType || !allergySeverity || !allergyStatus) {
          showToast('error', 'Allergen Name, Allergen Type, Severity, and Allergy Status are required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = `Allergy: ${allergenName}`;
        recordDoctor = allergyVerifiedBy;
        recordDate = allergyObservedDate || new Date().toISOString();
        recordDesc = allergyReaction ? `Reaction: ${allergyReaction}` : allergyNotes || `Allergy record for ${allergenName}`;
        categoryMetadata = {
          ...categoryMetadata,
          allergen_type: allergenType,
          allergen_name: allergenName,
          reaction: allergyReaction || undefined,
          severity: allergySeverity,
          first_observed_date: allergyObservedDate || undefined,
          allergy_status: allergyStatus,
          verified_by: allergyVerifiedBy || undefined,
          notes: allergyNotes || undefined,
        };
      } else if (addEmrCategory === 'MEDICAL_HISTORY') {
        if (!histCondition || !histType || !histStatus || !histSource) {
          showToast('error', 'Condition/Event Name, History Type, Current Status, and Source are required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = histCondition;
        recordDoctor = histProvider;
        recordInstitution = histProvider;
        recordDate = histOnset || new Date().toISOString();
        recordDesc = histDescription || `Medical history condition: ${histCondition}`;
        categoryMetadata = {
          ...categoryMetadata,
          history_type: histType,
          condition_name: histCondition,
          description: histDescription || undefined,
          onset_date: histOnset || undefined,
          end_date: histEnd || undefined,
          current_status: histStatus,
          treatment_details: histTreatment || undefined,
          hospital_provider: histProvider || undefined,
          source: histSource,
        };
      } else if (addEmrCategory === 'DIAGNOSTIC_REPORT') {
        if (!testName || !testCategory || !testDate || !testAbnormalFlag || !testVerificationStatus) {
          showToast('error', 'Test Name, Test Category, Test Date, Abnormal Flag, and Verification Status are required.');
          setIsSubmittingEmr(false);
          return;
        }
        recordTitle = testName;
        recordDoctor = testReportedBy;
        recordInstitution = testLab;
        recordDate = testDate;
        recordDesc = testSummary || `Diagnostic Report for ${testName} (${testCategory})`;
        categoryMetadata = {
          ...categoryMetadata,
          test_name: testName,
          test_category: testCategory,
          test_date: testDate,
          laboratory: testLab || undefined,
          result_summary: testSummary || undefined,
          result_value: testValue || undefined,
          unit: testUnit || undefined,
          reference_range: testRefRange || undefined,
          abnormal_flag: testAbnormalFlag,
          reported_by: testReportedBy || undefined,
          verification_status: testVerificationStatus,
        };
      }

      await createDigitalTwinEMRRecord(identifier, {
        title: recordTitle,
        category: addEmrCategory,
        doctor_name: recordDoctor || undefined,
        institution_name: recordInstitution || undefined,
        record_date: recordDate ? new Date(recordDate).toISOString() : undefined,
        description: recordDesc || undefined,
        metadata: categoryMetadata,
      });

      setIsAddEmrOpen(false);
      resetAddEmrForm();
      const catLabel = emrCategories.find(c => c.key === addEmrCategory)?.name || 'EMR';
      showToast('success', `${catLabel} record added successfully!`);
      await loadBackendData();
    } catch (err: any) {
      console.error('Failed to create EMR record:', err);
      showToast('error', err?.message || 'Failed to create EMR record. Please check inputs.');
    } finally {
      setIsSubmittingEmr(false);
    }
  };

  // Handle Document Upload submit
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !docTitle) return;
    setIsUploadingDoc(true);
    try {
      const identifier = getIdentifier();
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('document_type', docType);
      formData.append('file', docFile);

      await uploadDigitalTwinDocument(identifier, formData);
      setIsUploadDocOpen(false);
      setDocTitle('');
      setDocFile(null);
      showToast('success', 'Medical Document uploaded successfully!');
      await loadBackendData();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      showToast('error', err?.message || 'Failed to upload document. Please check file format and size.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Filter EMR Records for Drawer
  const drawerEmrRecords = emrRecords.filter((rec) => {
    const matchesCategory = selectedEmrCategory === 'ALL' || rec.category === selectedEmrCategory;
    const q = emrSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      rec.title.toLowerCase().includes(q) ||
      (rec.doctor_name && rec.doctor_name.toLowerCase().includes(q)) ||
      (rec.description && rec.description.toLowerCase().includes(q)) ||
      (rec.category_display && rec.category_display.toLowerCase().includes(q))
    );
    return matchesCategory && matchesSearch;
  });

  // Filter Documents for Drawer
  const drawerDocuments = documentsList.filter((doc) => {
    const q = docSearchQuery.toLowerCase().trim();
    return !q || (
      doc.title.toLowerCase().includes(q) ||
      doc.document_type.toLowerCase().includes(q) ||
      (doc.document_type_display && doc.document_type_display.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-[#F4F6FA] min-w-0 font-sans text-slate-800 relative">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute top-4 right-6 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full shadow-2xs border border-blue-100 z-20">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing Live Health Data...</span>
        </div>
      )}

      {/* Top Header & Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span onClick={onBack} className="hover:text-blue-600 cursor-pointer transition-colors">
            Members
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">{memberId}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Digital Health Twin</span>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200/60 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Members</span>
        </button>
      </div>

      {/* Profile Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left Side: Avatar & Details */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center text-slate-700 font-bold text-xl">
              <span className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 text-xl font-bold">
                {memberName.charAt(0)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{memberName}</h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                profile?.is_active ?? true ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile?.is_active ?? true ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                {profile?.is_active ?? true ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="text-xs font-medium text-slate-500">
              Member ID: <span className="font-semibold text-slate-700">{memberId}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5 font-medium">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{memberAge !== null ? `${memberAge} Years` : 'Age N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{memberGender}</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span className="font-bold text-slate-800">{bloodGroup}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{memberPhone}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{memberAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Active Health Plan Card */}
        <div className="w-full lg:w-auto bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between gap-6 cursor-pointer hover:bg-blue-100/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Active Health Plan</div>
              <div className="text-sm font-extrabold text-slate-900">{activePlan?.plan_name || 'No Active Plan'}</div>
              <div className="text-[11px] text-slate-500 font-medium">
                {activePlan?.end_date ? `Valid till ${activePlan.end_date}` : (activePlan ? 'Active' : 'No subscription')}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Main Content Dashboard Grid (3 Columns Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (Member Info & Active Health Plan) - 4 Cols */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Member Information Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Member Information</h3>
            </div>


            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-right">{memberName}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Member ID</span>
                <span className="font-mono font-bold text-slate-900">{memberId}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800 text-right">
                  {profile?.date_of_birth ? `${profile.date_of_birth}${memberAge !== null ? ` (${memberAge} years)` : ''}` : 'Not recorded'}
                </span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-semibold text-slate-800">{memberGender}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Blood Group</span>
                <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{bloodGroup}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Phone</span>
                <span className="font-mono font-semibold text-slate-800">{memberPhone}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{memberEmail}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium shrink-0">Address</span>
                <span className="font-semibold text-slate-800 text-right leading-relaxed pl-2">{memberAddress}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium shrink-0">Emergency Contact</span>
                <span className="font-semibold text-slate-800 text-right">{emergencyContactText}</span>
              </div>

              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Network Centre</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{memberCentre}</span>
              </div>

              <div className="flex items-start justify-between py-1">
                <span className="text-slate-500 font-medium">Primary Physician</span>
                <span className="font-bold text-slate-900">{primaryPhysician}</span>
              </div>
            </div>
          </div>

          {/* Active Health Plan Details Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Active Health Plan</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md transition-colors">
                View Details
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                activePlan ? 'bg-emerald-50/70 border-emerald-100' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center ${
                    activePlan ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{activePlan?.plan_name || 'No Active Plan'}</div>
                    <div className="text-[11px] text-slate-500">
                      {activePlan?.end_date ? `Valid till ${activePlan.end_date}` : (activePlan ? 'Active' : 'No active subscription')}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                  activePlan ? 'bg-emerald-200/80 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {activePlan ? 'Active' : 'None'}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Plan Type</span>
                  <span className="font-bold text-slate-900">{activePlan?.billing_cycle || '-'}</span>
                </div>

                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium shrink-0">Coverage</span>
                  <span className="font-semibold text-slate-800 text-right pl-2">
                    {activePlan ? 'Consultation, Diagnostic, Home Care' : 'Standard Member Benefits'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={`font-bold ${activePlan ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {activePlan ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Plan Financial Dashboard */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Health Plan Financial Summary</h3>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => addFinancialRecord('payment')} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100">+ Payment</button>
                <button type="button" onClick={() => addFinancialRecord('claim')} className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100">+ Claim</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Total Paid', financialSummary?.total_paid, 'text-emerald-700'],
                ['Total Due', financialSummary?.total_due, 'text-amber-700'],
                ['Total Claimed', financialSummary?.total_claimed, 'text-blue-700'],
                ['Approved Claims', financialSummary?.total_approved, 'text-indigo-700'],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <div className="text-[10px] text-slate-500 font-semibold">{label}</div>
                  <div className={`font-extrabold ${color}`}>{money(value as string)}</div>
                </div>
              ))}
            </div>
            <div className="text-xs font-bold text-slate-700">Benefits & Claims</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {benefitSummary.length ? benefitSummary.map((benefit) => (
                <div key={benefit.benefit_id} className="text-xs border-b border-slate-50 pb-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 truncate pr-2 font-semibold">{benefit.name}</span>
                    <span className="font-bold text-slate-900 whitespace-nowrap">{benefit.claims_count} claim(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Claimed: <b className="text-blue-700">{money(benefit.claim_amount)}</b></span>
                    <span className="text-slate-500">Approved: <b className="text-emerald-700">{money(benefit.approved_amount)}</b></span>
                  </div>
                </div>
              )) : <span className="text-xs text-slate-400">No benefit claims recorded</span>}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>{planHistory.length} plan record(s)</span>
              <span>{paymentHistory.length} payment(s) · {claimHistory.length} claim(s)</span>
            </div>
          </div>

        </div>

        {/* Middle Column (Health Timeline) - 5 Cols */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            
            {/* Header with Filter Dropdown & Refresh Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">Health Timeline</h3>
                <button
                  onClick={loadBackendData}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh Timeline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>

              <div className="relative">
                <select
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 pr-7 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All Services">All Services</option>
                  <option value="Consultations">Consultations</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Foreign Treatment">Foreign Treatment</option>
                  <option value="Home Care">Home Care</option>
                  <option value="Hospitalization">Hospitalization</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Cases">Patient Cases</option>
                  <option value="Clinical Records">Clinical Records</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Timeline Items Feed */}
            {filteredTimeline.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-xl space-y-1">
                <p className="font-extrabold text-slate-700 text-xs">No health timeline records available</p>
                <p className="text-[11px] text-slate-400">Activity from Appointments, Health Desk, Foreign Treatment, Home Care, Ambulance, etc. will automatically appear here as work is performed.</p>
              </div>
            ) : (

              <div className="relative space-y-4">
                {/* Central Vertical Timeline Line */}
                <div className="absolute left-[108px] top-3 bottom-3 w-0.5 bg-slate-200/80 z-0 pointer-events-none"></div>

                {filteredTimeline.map((item: TimelineEvent, idx: number) => {
                  const eventId = item.id || idx;
                  const title = item.title;
                  const subtitle = item.subtitle;
                  const provider = item.provider_name || '-';
                  const statusLabel = item.status_display || item.status || 'Recorded';
                  
                  const rawDate = item.event_date;
                  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                  const timeStr = rawDate ? new Date(rawDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

                  const iconInfo = getTimelineIcon(item.event_type);
                  const Icon = iconInfo.icon;
                  const badgeStyle = getStatusBadgeColor(item.status, item.status_display);

                  return (
                    <div
                      key={eventId}
                      onClick={() => setSelectedTimelineEvent(item)}
                      className="relative flex items-start gap-3 group cursor-pointer z-10"
                    >
                      
                      {/* Date Block */}
                      <div className="w-20 shrink-0 text-right pt-1.5">
                        <div className="text-[11px] font-extrabold text-slate-800">{dateStr}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{timeStr}</div>
                      </div>

                      {/* Service Icon Badge */}
                      <div className={`w-8 h-8 rounded-full ${iconInfo.bg} flex items-center justify-center shrink-0 z-10 shadow-xs border-2 border-white ring-1 ring-slate-200/70`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content Box */}
                      <div className="flex-1 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 rounded-xl p-3 transition-all shadow-2xs flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-xs truncate">{title}</span>
                            {item.source_id && (
                              <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/80">
                                #{item.source_id}
                              </span>
                            )}
                            {item.source_module && (
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                • {item.source_module.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium truncate">{subtitle}</div>
                          <div className="text-[10px] text-slate-500 font-medium truncate">{provider}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badgeStyle}`}>
                            {statusLabel}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}


          </div>
        </div>

        {/* Right Column (Recent EMR / EHR & Medical Documents) - 3 Cols */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Recent EMR / EHR Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Recent EMR / EHR</h3>
              <button
                onClick={() => {
                  setSelectedEmrCategory('ALL');
                  setIsEmrDrawerOpen(true);
                }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {emrCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedEmrCategory(cat.key);
                      setIsEmrDrawerOpen(true);
                    }}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1.5 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${cat.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{cat.count} record{cat.count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Medical Documents Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">Medical Documents</h3>
                <button
                  onClick={() => setIsUploadDocOpen(true)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Upload Document"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => setIsDocsDrawerOpen(true)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            {documentsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-xl space-y-2">
                <p>No medical documents available.</p>
                <button
                  onClick={() => setIsUploadDocOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {documentsList.slice(0, 4).map((doc: MedicalDocItem) => {
                  const title = doc.title;
                  const docDate = doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-';
                  
                  // Construct secure view/download URL
                  const downloadUrl = getDocFileUrl(doc);


                  return (
                    <div
                      key={doc.id || doc.public_id}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {doc.document_type === 'LAB_REPORT' ? 'LAB' : doc.document_type === 'XRAY' ? 'IMG' : 'PDF'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate text-[11px]">{title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{docDate}</div>
                        </div>
                      </div>

                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 hover:border-blue-300 text-blue-600 font-bold rounded-lg text-[10px] shadow-2xs shrink-0 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Add EMR Record Modal with 7 Categories */}
      {isAddEmrOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[70] p-4 overflow-y-auto">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <span>Add EMR / EHR Clinical Record</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Member: <span className="font-bold text-slate-800">{memberName}</span> ({memberId})
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddEmrOpen(false);
                  resetAddEmrForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200/80 overflow-x-auto scrollbar-none shrink-0 flex items-center gap-1.5">
              {emrCategories.map((cat) => {
                const IconComp = cat.icon;
                const isSelected = addEmrCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setAddEmrCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm scale-102'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Scrollable Content */}
            <form onSubmit={handleAddEmrRecord} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              
              {/* Category 1: CONSULTATIONS */}
              {addEmrCategory === 'CONSULTATION' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-blue-600" /> Consultation Record Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Consultation Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={consultDateTime}
                        onChange={(e) => setConsultDateTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Doctor / Provider Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Kazi Rahman"
                        value={consultDoctor}
                        onChange={(e) => setConsultDoctor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Consultation Type *</label>
                      <select
                        value={consultType}
                        onChange={(e) => setConsultType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="In-person">In-person Visit</option>
                        <option value="Online">Online Video / Tele-consult</option>
                        <option value="Phone">Phone Call</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Square Hospital, Dhaka"
                        value={consultHospital}
                        onChange={(e) => setConsultHospital(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Chief Complaint *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. High fever for 3 days and severe headache..."
                      value={consultChiefComplaint}
                      onChange={(e) => setConsultChiefComplaint(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Symptoms (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Fatigue, body pain, loss of appetite"
                        value={consultSymptoms}
                        onChange={(e) => setConsultSymptoms(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Clinical Notes (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Doctor's physical observation & examination notes..."
                        value={consultNotes}
                        onChange={(e) => setConsultNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Advice / Treatment Plan (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Advised rest, hydration, blood test after 48h..."
                        value={consultAdvice}
                        onChange={(e) => setConsultAdvice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Follow-up Date (Optional)</label>
                      <input
                        type="date"
                        value={consultFollowUp}
                        onChange={(e) => setConsultFollowUp(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category 2: DIAGNOSES */}
              {addEmrCategory === 'DIAGNOSIS' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-600" /> Diagnosis Entry Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Diagnosis Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Type 2 Diabetes Mellitus"
                        value={diagName}
                        onChange={(e) => setDiagName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ICD Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. E11.9"
                        value={diagCode}
                        onChange={(e) => setDiagCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Diagnosis Date *</label>
                      <input
                        type="date"
                        required
                        value={diagDate}
                        onChange={(e) => setDiagDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Diagnosis Type *</label>
                      <select
                        value={diagType}
                        onChange={(e) => setDiagType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Suspected">Suspected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Severity (Optional)</label>
                      <select
                        value={diagSeverity}
                        onChange={(e) => setDiagSeverity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Diagnosed By Doctor *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Anisur Rahman (Endocrinologist)"
                      value={diagDoctor}
                      onChange={(e) => setDiagDoctor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Clinical Notes (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Diagnostic reasoning, history notes..."
                        value={diagNotes}
                        onChange={(e) => setDiagNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Source / Evidence (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Fasting blood sugar 140 mg/dL & HbA1c 7.8%"
                        value={diagEvidence}
                        onChange={(e) => setDiagEvidence(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category 3: PRESCRIPTIONS */}
              {addEmrCategory === 'PRESCRIPTION' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-rose-600" /> Prescription Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Prescription Date *</label>
                      <input
                        type="date"
                        required
                        value={rxDate}
                        onChange={(e) => setRxDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Prescribed By Doctor *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Shahin Ahmed"
                        value={rxDoctor}
                        onChange={(e) => setRxDoctor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Prescription Item Dynamic List */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-extrabold text-slate-800 text-xs">
                        Prescribed Medications ({rxItems.length}) *
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRxItem}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Medication Item</span>
                      </button>
                    </div>

                    {rxItems.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 relative">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                          <span className="font-bold text-slate-700 text-[11px]">Medication Item #{idx + 1}</span>
                          {rxItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRxItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Medication Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Napa Extra / Seclo 20mg"
                              value={item.medication_name}
                              onChange={(e) => handleRxItemChange(idx, 'medication_name', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Strength (e.g. 500mg)</label>
                            <input
                              type="text"
                              placeholder="500 mg"
                              value={item.strength}
                              onChange={(e) => handleRxItemChange(idx, 'strength', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Dosage *</label>
                            <input
                              type="text"
                              required
                              placeholder="1 tablet"
                              value={item.dosage}
                              onChange={(e) => handleRxItemChange(idx, 'dosage', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Route *</label>
                            <select
                              value={item.route}
                              onChange={(e) => handleRxItemChange(idx, 'route', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Oral">Oral</option>
                              <option value="Topical">Topical</option>
                              <option value="Injectable">Injectable</option>
                              <option value="Inhalation">Inhalation</option>
                              <option value="Drops">Drops</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Frequency *</label>
                            <input
                              type="text"
                              required
                              placeholder="1-0-1 (2 times)"
                              value={item.frequency}
                              onChange={(e) => handleRxItemChange(idx, 'frequency', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Duration *</label>
                            <input
                              type="text"
                              required
                              placeholder="5 days"
                              value={item.duration}
                              onChange={(e) => handleRxItemChange(idx, 'duration', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Prescription Special Instructions (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Take after food. Avoid drinking tea or coffee within 1 hour of dose..."
                      value={rxInstructions}
                      onChange={(e) => setRxInstructions(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Category 4: MEDICATIONS */}
              {addEmrCategory === 'MEDICATION' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-600" /> Medication History & Current Intake Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Medication Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metformin HCL"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Medication Status *</label>
                      <select
                        value={medStatus}
                        onChange={(e) => setMedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Active">Active (Currently taking)</option>
                        <option value="Completed">Completed</option>
                        <option value="Stopped">Stopped / Discontinued</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Strength (Optional)</label>
                      <input
                        type="text"
                        placeholder="500 mg"
                        value={medStrength}
                        onChange={(e) => setMedStrength(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Dosage (Optional)</label>
                      <input
                        type="text"
                        placeholder="1 tablet"
                        value={medDosage}
                        onChange={(e) => setMedDosage(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Route (Optional)</label>
                      <select
                        value={medRoute}
                        onChange={(e) => setMedRoute(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Oral">Oral</option>
                        <option value="Topical">Topical</option>
                        <option value="Injectable">Injectable</option>
                        <option value="Inhalation">Inhalation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Frequency (Optional)</label>
                      <input
                        type="text"
                        placeholder="Daily at night"
                        value={medFrequency}
                        onChange={(e) => setMedFrequency(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Start Date (Optional)</label>
                      <input
                        type="date"
                        value={medStartDate}
                        onChange={(e) => setMedStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={medEndDate}
                        onChange={(e) => setMedEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Prescribing Doctor (Optional)</label>
                      <input
                        type="text"
                        placeholder="Doctor name..."
                        value={medDoctor}
                        onChange={(e) => setMedDoctor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notes / Additional Context (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Medication history notes or patient compliance details..."
                      value={medNotes}
                      onChange={(e) => setMedNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Category 5: ALLERGIES */}
              {addEmrCategory === 'ALLERGY' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Allergy Record Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Allergen Type *</label>
                      <select
                        value={allergenType}
                        onChange={(e) => setAllergenType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Medicine">Medicine / Drug</option>
                        <option value="Food">Food / Diet</option>
                        <option value="Environmental">Environmental / Dust / Pollen</option>
                        <option value="Other">Other Substance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Allergen Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Penicillin / Peanuts / Dust"
                        value={allergenName}
                        onChange={(e) => setAllergenName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Severity *</label>
                      <select
                        value={allergySeverity}
                        onChange={(e) => setAllergySeverity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe / Anaphylactic</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Allergy Status *</label>
                      <select
                        value={allergyStatus}
                        onChange={(e) => setAllergyStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Active">Active</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Unconfirmed">Unconfirmed</option>
                        <option value="Unknown">Unknown</option>
                        <option value="Not assessed">Not assessed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">First Observed Date (Optional)</label>
                      <input
                        type="date"
                        value={allergyObservedDate}
                        onChange={(e) => setAllergyObservedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Reaction (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Skin rash, swelling, difficulty breathing"
                        value={allergyReaction}
                        onChange={(e) => setAllergyReaction(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Verified By Provider (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Immunologist"
                        value={allergyVerifiedBy}
                        onChange={(e) => setAllergyVerifiedBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Additional safety precautions or patient remarks..."
                      value={allergyNotes}
                      onChange={(e) => setAllergyNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Category 6: MEDICAL HISTORY */}
              {addEmrCategory === 'MEDICAL_HISTORY' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-indigo-600" /> Medical & Surgical History Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">History Type *</label>
                      <select
                        value={histType}
                        onChange={(e) => setHistType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Disease">Chronic Disease / Illness</option>
                        <option value="Surgery">Past Surgery / Procedure</option>
                        <option value="Family">Family Medical History</option>
                        <option value="Other">Other Event</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Condition / Event Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hypertension / Appendectomy"
                        value={histCondition}
                        onChange={(e) => setHistCondition(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Current Status *</label>
                      <select
                        value={histStatus}
                        onChange={(e) => setHistStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Ongoing">Ongoing</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Source of Record *</label>
                      <select
                        value={histSource}
                        onChange={(e) => setHistSource(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Patient">Patient Reported</option>
                        <option value="Provider">Doctor / Provider Document</option>
                        <option value="Previous Record">Previous Hospital Record</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Onset Date (Optional)</label>
                      <input
                        type="date"
                        value={histOnset}
                        onChange={(e) => setHistOnset(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={histEnd}
                        onChange={(e) => setHistEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hospital / Provider (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Labaid Hospital"
                        value={histProvider}
                        onChange={(e) => setHistProvider(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Treatment Details (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Medications taken, surgical details..."
                      value={histTreatment}
                      onChange={(e) => setHistTreatment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Category 7: DIAGNOSTIC REPORTS */}
              {addEmrCategory === 'DIAGNOSTIC_REPORT' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TestTube className="w-4 h-4 text-cyan-600" /> Diagnostic Report Form
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Test Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Complete Blood Count (CBC) / Chest X-Ray"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Test Category *</label>
                      <select
                        value={testCategory}
                        onChange={(e) => setTestCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Blood">Blood Test</option>
                        <option value="Imaging">Imaging (X-Ray, MRI, CT)</option>
                        <option value="Urine">Urine Test</option>
                        <option value="Pathology">Pathology / Biopsy</option>
                        <option value="Other">Other Laboratory Test</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Test Date *</label>
                      <input
                        type="date"
                        required
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Abnormal Flag *</label>
                      <select
                        value={testAbnormalFlag}
                        onChange={(e) => setTestAbnormalFlag(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Abnormal">Abnormal</option>
                        <option value="Critical">Critical</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Verification Status *</label>
                      <select
                        value={testVerificationStatus}
                        onChange={(e) => setTestVerificationStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Verified">Verified</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Result Value (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 11.5"
                        value={testValue}
                        onChange={(e) => setTestValue(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Unit (Optional)</label>
                      <input
                        type="text"
                        placeholder="g/dL"
                        value={testUnit}
                        onChange={(e) => setTestUnit(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Reference Range (Optional)</label>
                      <input
                        type="text"
                        placeholder="12.0 - 15.5 g/dL"
                        value={testRefRange}
                        onChange={(e) => setTestRefRange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Laboratory / Diagnostic Centre (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Popular Diagnostic Centre"
                        value={testLab}
                        onChange={(e) => setTestLab(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Reported By Pathologist/Lab (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Pathologist Name"
                        value={testReportedBy}
                        onChange={(e) => setTestReportedBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Result Summary / Findings (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Summary of lab findings, impression, or key values..."
                      value={testSummary}
                      onChange={(e) => setTestSummary(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Common System Fields Section */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3 mt-4">
                <div className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>System Metadata & Verification</span>
                  <span className="text-[10px] font-medium text-slate-400">Auto-tracked system fields</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Source Type</label>
                    <select
                      value={commonSourceType}
                      onChange={(e) => setCommonSourceType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Manual Entry">Manual Entry (Staff / HQ)</option>
                      <option value="Appointment">Linked Appointment Record</option>
                      <option value="Provider">Direct Provider Submission</option>
                      <option value="Imported">Imported Document / File</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Record Status</label>
                    <select
                      value={commonRecordStatus}
                      onChange={(e) => setCommonRecordStatus(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Administrative Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Internal verification or administrative remarks..."
                    value={commonNotes}
                    onChange={(e) => setCommonNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEmrOpen(false);
                    resetAddEmrForm();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmr}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingEmr && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingEmr ? 'Saving Record...' : 'Save EMR Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Medical Document Modal */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[70] p-4">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Upload Medical Document</h3>
              <button
                onClick={() => setIsUploadDocOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="LAB_REPORT">Lab / Test Report</option>
                  <option value="XRAY">X-Ray / Imaging</option>
                  <option value="PRESCRIPTION">Prescription</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="OTHER">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blood Test Report"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select File (PDF, Image) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDocFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl p-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc || !docFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploadingDoc && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUploadingDoc ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMR Records Management Drawer / Modal */}
      {isEmrDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">EMR / EHR Clinical Records</h3>
                <p className="text-xs text-slate-500 font-medium">Member: {memberName} · {memberId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddEmrOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add EMR Record</span>
                </button>
                <button
                  onClick={() => setIsEmrDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter Tabs & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search EMR records by title, doctor or description..."
                    value={emrSearchQuery}
                    onChange={(e) => setEmrSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                <button
                  onClick={() => setSelectedEmrCategory('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    selectedEmrCategory === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  All ({emrRecords.length})
                </button>
                {emrCategories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedEmrCategory(cat.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                      selectedEmrCategory === cat.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedEmrCategory === cat.key ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* EMR Records List Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              {drawerEmrRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600 text-sm">No EMR records found</p>
                  <p>There are no clinical records matching your search or category filter.</p>
                </div>
              ) : (
                drawerEmrRecords.map((rec) => {
                  const dateStr = rec.record_date || rec.created_at
                    ? new Date(rec.record_date || rec.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-';
                  return (
                    <div
                      key={rec.id || rec.public_id}
                      onClick={() => setSelectedEmrRecord(rec)}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                              {rec.category_display || rec.category}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{rec.title}</h4>
                          </div>
                          {rec.doctor_name && (
                            <div className="text-xs font-bold text-blue-600 mt-0.5">
                              Doctor / Specialist: {rec.doctor_name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400 shrink-0">{dateStr}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>

                      {rec.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
                          {rec.description}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* Medical Documents Drawer / Modal */}
      {isDocsDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Medical Documents Repository</h3>
                <p className="text-xs text-slate-500 font-medium">Uploaded lab reports, X-rays, and medical files for {memberName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUploadDocOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
                <button
                  onClick={() => setIsDocsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search documents by title or type..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Documents Grid / List */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              {drawerDocuments.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600 text-sm">No medical documents found</p>
                  <p>There are no uploaded documents matching your search filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {drawerDocuments.map((doc) => {
                    const docDate = doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-';
                    const downloadUrl = getDocFileUrl(doc);


                    return (
                      <div
                        key={doc.id || doc.public_id}
                        className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                            {doc.document_type === 'LAB_REPORT' ? 'LAB' : doc.document_type === 'XRAY' ? 'IMG' : 'PDF'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{doc.title}</h4>
                            <div className="text-[11px] text-slate-500 font-semibold">{doc.document_type_display || doc.document_type}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{docDate}</div>
                          </div>
                        </div>

                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Timeline Event Details Modal */}
      {selectedTimelineEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTimelineIcon(selectedTimelineEvent.event_type).bg}`}>
                  {React.createElement(getTimelineIcon(selectedTimelineEvent.event_type).icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedTimelineEvent.title}</h3>
                  <div className="text-xs font-semibold text-slate-500">{selectedTimelineEvent.subtitle}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTimelineEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">Status</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {selectedTimelineEvent.status_display || selectedTimelineEvent.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">Event Date</span>
                  <span className="font-bold text-slate-800 text-xs block mt-0.5">
                    {selectedTimelineEvent.event_date
                      ? new Date(selectedTimelineEvent.event_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Provider / Doctor</span>
                  <span className="font-bold text-slate-900">{selectedTimelineEvent.provider_name || '-'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Source Module</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] uppercase">
                    {selectedTimelineEvent.source_module}
                  </span>
                </div>

                {selectedTimelineEvent.source_id && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Reference Code</span>
                    <span className="font-mono font-bold text-slate-900">#{selectedTimelineEvent.source_id}</span>
                  </div>
                )}

                {selectedTimelineEvent.details && Object.keys(selectedTimelineEvent.details).length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-slate-500 font-bold block">Event Details:</span>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 font-medium text-slate-700">
                      {Object.entries(selectedTimelineEvent.details).map(([k, v]) => (
                        <div key={k} className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="capitalize text-slate-500">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-bold text-slate-900 text-right">{v ? String(v) : '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTimelineEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMR Record Detail Modal */}
      {selectedEmrRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                    {selectedEmrRecord.category_display || selectedEmrRecord.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    selectedEmrRecord.metadata?.record_status === 'Pending Review'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedEmrRecord.metadata?.record_status === 'Draft'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedEmrRecord.metadata?.record_status || 'Verified'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedEmrRecord.title}</h3>
                <div className="text-xs text-slate-500 font-medium">Member: {memberName} ({memberId})</div>
              </div>
              <button
                onClick={() => setSelectedEmrRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Specific Detailed Breakdown Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 text-xs">
              
              <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Record Date</span>
                  <span className="font-bold text-slate-900">
                    {selectedEmrRecord.record_date || selectedEmrRecord.created_at
                      ? new Date(selectedEmrRecord.record_date || selectedEmrRecord.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </span>
                </div>

                {selectedEmrRecord.doctor_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Doctor / Provider</span>
                    <span className="font-extrabold text-blue-700">{selectedEmrRecord.doctor_name}</span>
                  </div>
                )}

                {selectedEmrRecord.institution_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Hospital / Lab</span>
                    <span className="font-bold text-slate-800">{selectedEmrRecord.institution_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Entered By</span>
                  <span className="font-bold text-slate-800">{selectedEmrRecord.created_by_name || 'Authorized Staff'}</span>
                </div>
              </div>

              {/* Consultation specifics */}
              {selectedEmrRecord.category === 'CONSULTATION' && (
                <div className="space-y-2">
                  {selectedEmrRecord.metadata?.consultation_type && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Consultation Type:</span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{selectedEmrRecord.metadata.consultation_type}</span>
                    </div>
                  )}
                  {selectedEmrRecord.metadata?.chief_complaint && (
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">Chief Complaint:</div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium">{selectedEmrRecord.metadata.chief_complaint}</div>
                    </div>
                  )}
                  {selectedEmrRecord.metadata?.symptoms && (
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">Symptoms:</div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium">{selectedEmrRecord.metadata.symptoms}</div>
                    </div>
                  )}
                  {selectedEmrRecord.metadata?.clinical_notes && (
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">Clinical Notes:</div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium">{selectedEmrRecord.metadata.clinical_notes}</div>
                    </div>
                  )}
                  {selectedEmrRecord.metadata?.advice_treatment_plan && (
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">Advice / Treatment Plan:</div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium">{selectedEmrRecord.metadata.advice_treatment_plan}</div>
                    </div>
                  )}
                  {selectedEmrRecord.metadata?.follow_up_date && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-semibold">Follow-up Date:</span>
                      <span className="font-bold text-blue-600">{selectedEmrRecord.metadata.follow_up_date}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Diagnosis specifics */}
              {selectedEmrRecord.category === 'DIAGNOSIS' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-semibold block">Diagnosis Type</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.diagnosis_type || 'Confirmed'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">ICD Code</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.diagnosis_code || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Severity</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.severity || 'Moderate'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Diagnosed By</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.diagnosed_by || selectedEmrRecord.doctor_name || 'Doctor'}</span>
                    </div>
                  </div>
                  {selectedEmrRecord.metadata?.source_evidence && (
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">Source / Evidence:</div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium">{selectedEmrRecord.metadata.source_evidence}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Prescription specifics */}
              {selectedEmrRecord.category === 'PRESCRIPTION' && (
                <div className="space-y-2.5">
                  {Array.isArray(selectedEmrRecord.metadata?.prescription_items) && selectedEmrRecord.metadata.prescription_items.length > 0 ? (
                    <div>
                      <div className="font-bold text-slate-800 mb-1">Prescribed Medicines ({selectedEmrRecord.metadata.prescription_items.length}):</div>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2">Medication</th>
                              <th className="p-2">Dosage</th>
                              <th className="p-2">Route</th>
                              <th className="p-2">Frequency</th>
                              <th className="p-2">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {selectedEmrRecord.metadata.prescription_items.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-800">{item.medication_name} {item.strength ? `(${item.strength})` : ''}</td>
                                <td className="p-2 text-slate-600">{item.dosage}</td>
                                <td className="p-2 text-slate-600">{item.route}</td>
                                <td className="p-2 text-slate-600">{item.frequency}</td>
                                <td className="p-2 text-slate-600">{item.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {selectedEmrRecord.description && (
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">Instructions & Notes:</div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium">{selectedEmrRecord.description}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Medication specifics */}
              {selectedEmrRecord.category === 'MEDICATION' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-semibold block">Status</span>
                      <span className="font-bold text-emerald-700">{selectedEmrRecord.metadata?.medication_status || 'Active'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Dosage / Frequency</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.dosage || '-'} ({selectedEmrRecord.metadata?.frequency || '-'})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Route</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.route || 'Oral'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Strength</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.strength || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Allergy specifics */}
              {selectedEmrRecord.category === 'ALLERGY' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-semibold block">Allergen Type</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.allergen_type || 'Medicine'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Severity</span>
                      <span className="font-bold text-amber-700">{selectedEmrRecord.metadata?.severity || 'Moderate'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Status</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.allergy_status || 'Active'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Reaction</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.reaction || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical History specifics */}
              {selectedEmrRecord.category === 'MEDICAL_HISTORY' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-semibold block">History Type</span>
                      <span className="font-bold text-indigo-700">{selectedEmrRecord.metadata?.history_type || 'Disease'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Current Status</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.current_status || 'Ongoing'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Source</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.source || 'Patient'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Onset Date</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.onset_date || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostic Report specifics */}
              {selectedEmrRecord.category === 'DIAGNOSTIC_REPORT' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-semibold block">Test Category</span>
                      <span className="font-bold text-cyan-700">{selectedEmrRecord.metadata?.test_category || 'Blood'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Abnormal Flag</span>
                      <span className={`font-extrabold px-1.5 py-0.5 rounded text-[10px] inline-block ${
                        selectedEmrRecord.metadata?.abnormal_flag === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedEmrRecord.metadata?.abnormal_flag === 'Abnormal'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedEmrRecord.metadata?.abnormal_flag || 'Normal'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Result Value</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.result_value || '-'} {selectedEmrRecord.metadata?.unit || ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Reference Range</span>
                      <span className="font-bold text-slate-800">{selectedEmrRecord.metadata?.reference_range || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* General Description / Notes if not already rendered */}
              {selectedEmrRecord.description && selectedEmrRecord.category !== 'PRESCRIPTION' && selectedEmrRecord.category !== 'CONSULTATION' && (
                <div>
                  <div className="font-bold text-slate-800 mb-0.5">Clinical Notes / Details:</div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 font-medium leading-relaxed">
                    {selectedEmrRecord.description}
                  </div>
                </div>
              )}

              {/* System Metadata block */}
              <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/70 text-[11px] space-y-1 text-slate-500">
                <div className="flex justify-between">
                  <span>Record Public ID:</span>
                  <span className="font-mono text-slate-700">{selectedEmrRecord.public_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source Type:</span>
                  <span className="font-semibold text-slate-700">{selectedEmrRecord.metadata?.source_type || 'Manual Entry'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created At:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedEmrRecord.created_at).toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedEmrRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
