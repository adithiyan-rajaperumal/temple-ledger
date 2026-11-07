import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getPublicReceipt } from '../services/api';

/**
 * Digital Receipt Modal for donors and community members.
 * Supports printable view via @media print stylesheet and WhatsApp sharing.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.receiptNo]
 * @param {Object} [props.receiptData]
 * @param {Object} [props.transaction]
 */
export default function ReceiptModal({
  isOpen,
  onClose,
  receiptNo,
  receiptData,
  transaction,
}) {
  const { t, i18n } = useTranslation();
  const [receipt, setReceipt] = useState(receiptData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(true);

  // Fetch receipt details if receiptNo is provided and data is incomplete
  useEffect(() => {
    if (!isOpen) return;

    if (receiptData) {
      setReceipt(receiptData);
      return;
    }

    const targetNo = receiptNo || transaction?.referenceNo;
    const isDonation =
      transaction?.flowType === 'INCOME' ||
      transaction?.flowType === 'IN_KIND' ||
      (targetNo && targetNo.startsWith('RCT-'));

    if (targetNo && isDonation) {
      setLoading(true);
      setError(null);
      getPublicReceipt(targetNo)
        .then((data) => {
          setReceipt(data);
        })
        .catch((err) => {
          console.error('Failed to load receipt:', err);
          // Fall back to transaction item if available
          if (transaction) {
            setReceipt({
              receiptNo: transaction.referenceNo,
              donationDate: transaction.date,
              donorName: transaction.partyName,
              village: transaction.village,
              amount: transaction.amount,
              paymentMode: transaction.paymentMode,
              notes: transaction.notes,
            });
          } else {
            setError(err.message || 'Receipt not found');
          }
        })
        .finally(() => setLoading(false));
    } else if (transaction) {
      setReceipt(transaction);
    }
  }, [isOpen, receiptNo, receiptData, transaction]);

  if (!isOpen) return null;

  const isExpenseVoucher =
    transaction?.flowType === 'EXPENSE' ||
    receipt?.flowType === 'EXPENSE' ||
    (receipt?.referenceNo && receipt.referenceNo.startsWith('VCH-'));

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectiveRefNo = receipt?.receiptNo || receipt?.referenceNo || receiptNo || '';
  const publicVerifyUrl = `${origin}/receipts/${effectiveRefNo}`;

  const donorName =
    receipt?.donorName ||
    receipt?.partyName ||
    receipt?.paidTo ||
    'Devotee / Contributor';

  const donorNameTa = receipt?.donorNameTa || null;

  const amountVal = receipt?.amount || receipt?.totalEstimatedValue || 0;
  const formattedAmount = formatCurrency(amountVal);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(publicVerifyUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const formattedDate = formatDate(
      receipt?.donationDate || receipt?.date || new Date().toISOString()
    );

    const locationParts = [receipt?.area || receipt?.village, receipt?.state, receipt?.country]
      .filter(Boolean)
      .join(', ');
    const locationLine = locationParts ? `இடம் / Location: ${locationParts}\n` : '';

    const bookDetails =
      receipt?.bookNo || receipt?.manualReceiptNo
        ? `புத்தக எண் / Book: ${receipt?.bookNo || '-'}, ரசீது / Slip: ${receipt?.manualReceiptNo || '-'}\n`
        : receipt?.physicalBookReceiptNo
        ? `புத்தக ரசீது / Manual Ref: ${receipt.physicalBookReceiptNo}\n`
        : '';

    const message =
      `வணக்கம் ${donorName}, 1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஒத்தலவாடி திருப்பணிக்கு உங்கள் அன்பான நன்கொடை ${formattedAmount} வெற்றிகரமாக பெறப்பட்டது.\n` +
      `ரசீது எண்: ${effectiveRefNo}\n` +
      `தேதி: ${formattedDate}\n` +
      bookDetails +
      locationLine +
      `\nGreetings ${donorName}, thank you for your generous contribution of ${formattedAmount} towards 1008 Sri Vrishabhanatha Jinalayam, Othalavadi.\n` +
      `Receipt No: ${effectiveRefNo}\n` +
      `Date: ${formattedDate}\n\n` +
      `அதிகாரப்பூர்வ ரசீதை காண / Verify Receipt:\n${publicVerifyUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Toolbar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm tracking-wide">
              {isExpenseVoucher
                ? t('receipt.voucherTitle')
                : t('receipt.receiptTitle')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title={t('buttons.print')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title={t('buttons.close')}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-600 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500 font-medium">
                {t('common.loading')}
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
              <p className="mt-2 text-rose-700 font-semibold">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
              >
                {t('buttons.close')}
              </button>
            </div>
          ) : receipt ? (
            /* Printable Receipt Card Body */
            <div
              id="printable-receipt"
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xs"
            >
              {/* Temple Traditional Header */}
              <div className="text-center pb-5 border-b border-dashed border-slate-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mb-2">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  அருள்மிகு ஸ்ரீ முத்துமாரியம்மன் திருக்கோவில்
                </h2>
                <h3 className="text-sm font-medium text-slate-700 mt-0.5">
                  Sri Muthumariamman Temple Renovation Fund
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Main Village • Public Transparency Ledger
                </p>

                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {isExpenseVoucher
                    ? t('receipt.voucherTitle')
                    : t('receipt.receiptTitle')}{' '}
                  • {t('receipt.verifiedOnline')}
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">
                    {isExpenseVoucher
                      ? t('receipt.voucherNumber')
                      : t('receipt.receiptNumber')}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                    {effectiveRefNo}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-xs">
                    {t('receipt.date')}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(receipt.donationDate || receipt.date || receipt.createdAt)}
                  </span>
                </div>
              </div>

              {/* Donor / Party Information */}
              <div className="py-4 border-b border-slate-100 text-sm">
                <p className="text-xs text-slate-400">
                  {isExpenseVoucher
                    ? t('forms.paidTo')
                    : t('receipt.receivedWithThanks')}
                </p>
                <div className="mt-1 flex flex-col">
                  {donorNameTa && (
                    <span className="text-base font-bold text-slate-900">
                      {donorNameTa}
                    </span>
                  )}
                  <span
                    className={`font-semibold text-slate-800 ${
                      donorNameTa ? 'text-xs text-slate-500' : 'text-base'
                    }`}
                  >
                    {donorName}
                  </span>
                </div>
                {(receipt.area || receipt.village || receipt.doorNo || receipt.street || receipt.state || receipt.country) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {[receipt.doorNo, receipt.street, receipt.area || receipt.village, receipt.state, receipt.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                {receipt.phone && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('receipt.phone')}: {receipt.phone}
                  </p>
                )}
              </div>

              {/* Amount Highlight */}
              <div className="py-5 bg-gradient-to-r from-amber-50/50 via-slate-50 to-amber-50/50 rounded-xl my-4 px-4 text-center border border-amber-100/60">
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">
                  {isExpenseVoucher ? t('tables.amount') : t('receipt.theSumOf')}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight block mt-1">
                  {formattedAmount}
                </span>
                <p className="text-xs text-slate-500 mt-1 italic">
                  {t('receipt.towards')}
                </p>
              </div>

              {/* Payment Details Breakdown */}
              <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5 border border-slate-200/70">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">{t('forms.paymentMode')}:</span>
                  <span className="font-semibold text-slate-900">
                    {receipt.paymentMode === 'CASH'
                      ? t('forms.cash')
                      : receipt.paymentMode === 'GPAY_ONLINE'
                      ? t('forms.gpay')
                      : receipt.paymentMode === 'IN_KIND'
                      ? t('forms.inKind')
                      : receipt.paymentMode || '-'}
                  </span>
                </div>

                {(receipt.bookNo || receipt.manualReceiptNo) ? (
                  <>
                    {receipt.bookNo && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('receipt.bookNo')}:</span>
                        <span className="font-mono font-medium text-slate-900">
                          {receipt.bookNo}
                        </span>
                      </div>
                    )}
                    {receipt.manualReceiptNo && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('receipt.receiptSlipNo')}:</span>
                        <span className="font-mono font-medium text-slate-900">
                          {receipt.manualReceiptNo}
                        </span>
                      </div>
                    )}
                  </>
                ) : receipt.physicalBookReceiptNo ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('forms.physicalReceiptNo')}:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {receipt.physicalBookReceiptNo}
                    </span>
                  </div>
                ) : null}

                {receipt.gpayTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('forms.gpayTxnId')}:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {receipt.gpayTransactionId}
                    </span>
                  </div>
                )}

                {/* In-Kind Donation Details */}
                {receipt.paymentMode === 'IN_KIND' && receipt.itemCategory && (
                  <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('forms.itemCategory')}:</span>
                      <span className="font-medium text-slate-900">
                        {receipt.itemCategory}
                      </span>
                    </div>
                    {receipt.itemDescription && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('forms.itemDescription')}:</span>
                        <span className="font-medium text-slate-900">
                          {receipt.itemDescription}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('receipt.quantityUnit')}:</span>
                      <span className="font-medium text-slate-900">
                        {receipt.quantity} {receipt.unit}
                      </span>
                    </div>
                    {receipt.approximateUnitRate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('receipt.unitRate')}:</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(receipt.approximateUnitRate)} / {receipt.unit}
                        </span>
                      </div>
                    )}
                    {receipt.storageLocation && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('receipt.storageLocation')}:</span>
                        <span className="font-medium text-slate-900">
                          {receipt.storageLocation}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cumulative Progress for Family Drive or Pledge */}
                {receipt.cumulativePaidForDriveOrPledge !== undefined &&
                  receipt.cumulativePaidForDriveOrPledge !== null && (
                    <div className="pt-2 mt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">
                          {t('receipt.cumulativePaid')}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(receipt.cumulativePaidForDriveOrPledge)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">
                          {t('receipt.balanceRemaining')}
                        </span>
                        <span className="font-semibold text-rose-700">
                          {formatCurrency(receipt.remainingDueForDriveOrPledge || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                {receipt.journalEntryNumber && (
                  <div className="flex justify-between pt-1 text-[11px] text-slate-400">
                    <span>Journal Ref:</span>
                    <span className="font-mono">{receipt.journalEntryNumber}</span>
                  </div>
                )}

                {receipt.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block text-[11px]">
                      {t('receipt.notes')}:
                    </span>
                    <p className="text-slate-700 text-xs italic mt-0.5">
                      {receipt.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Verification Section with QR Code */}
              <div className="mt-5 pt-4 border-t border-dashed border-slate-300 flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <p className="text-xs font-semibold text-slate-800">
                    {t('receipt.authorizedSignatory')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t('receipt.qrVerifyNote')}
                  </p>
                  <div className="no-print mt-2 flex items-center space-x-2">
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center text-[11px] text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-emerald-600" />
                          <span className="text-emerald-600">
                            {t('receipt.linkCopied')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          <span>{t('receipt.copyLink')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Scannable QR Code */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                    {qrLoaded ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          publicVerifyUrl
                        )}`}
                        alt="Verification QR"
                        className="w-full h-full object-contain"
                        onError={() => setQrLoaded(false)}
                      />
                    ) : (
                      /* SVG Fallback if external image is unavailable */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-[9px] text-slate-500 text-center p-1">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-0.5" />
                        <span className="font-mono text-[8px] font-bold">
                          {effectiveRefNo.slice(0, 12)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Bottom Action Footer (hidden in print) */}
        <div className="no-print px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {!isExpenseVoucher && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                {t('buttons.shareWhatsApp')}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
              {t('buttons.print')}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            {t('buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
