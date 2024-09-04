import { useEffect, useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import { Type } from '@/components/form/Input';
import { InputText } from '@/components/form/InputText';
import { ClosedStateModal } from '@/components/ui/ClosedStateModal';
import {
  riskSeverityOptions,
  riskStatusOptions,
} from '@/components/ui/RiskDropdown';
import { useDeleteRisk } from '@/hooks/useRisks';
import {
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskStatusLabel,
  SeverityDef,
} from '@/types';
import { cn } from '@/utils/classname';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { getStatusSeverity } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

interface Props {
  isLoading: boolean;
  onSave?: (comment: string, status: string) => Promise<void>;
  title?: string;
  risk: Risk;
}

export const Comment: React.FC<Props> = ({ risk, onSave }: Props) => {
  const comment = risk.comment;
  const isEditing = true;
  const { status: riskStatusKey, severity: riskSeverityKey } =
    getStatusSeverity(risk.status);
  const [value, setValue] = useState(comment);
  const [isSaving, setIsSaving] = useState(false);

  const [status, setStatus] = useState(riskStatusKey);
  const [severity, setSeverity] = useState(riskSeverityKey);
  const [isClosedSubStateModalOpen, setIsClosedSubStateModalOpen] =
    useState(false);

  const { mutate: deleteRisk } = useDeleteRisk();
  const { removeSearchParams } = useSearchParams();

  const statusLabel = RiskStatusLabel[status] || status;
  const severityLabel = SeverityDef[severity] || severity;

  const isSeverityChanged = riskSeverityKey !== severity;
  const isStatusChanged = riskStatusKey !== status;

  useEffect(() => {
    if (!isEditing) {
      setValue(comment);
    }
  }, [isEditing, comment]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        if (risk.status === RiskStatus.ExposedRisks) {
          await onSave(value, risk.status);
        } else {
          await onSave(value, `${status}${severity || ''}`);
        }
      }
      setValue('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const isUpdated = isSeverityChanged || isStatusChanged || Boolean(value);

  function handleDeleteRisk() {
    deleteRisk([risk]);
    removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
  }

  return (
    <div
      className={cn(
        'transition-all rounded-sm mt-4 bg-gray-100 p-4 cursor-pointer'
      )}
    >
      {risk.status !== RiskStatus.ExposedRisks && (
        <div className="mb-4 flex items-start gap-3">
          {/* Severity */}
          <Dropdown
            className={cn(
              `border-1 min-w-28 justify-between rounded-[2px] border border-default py-1 pr-2`,
              getSeverityClass(severity)
            )}
            menu={{
              items: riskSeverityOptions,
              onClick: value => {
                if (value) {
                  setSeverity(value as RiskSeverity);
                }
              },
            }}
            startIcon={
              riskSeverityOptions.find(
                option => option.value === riskSeverityKey
              )?.icon
            }
            endIcon={<ChevronDownIcon className="size-3 text-default-light" />}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex-1 text-left">{severityLabel}</div>
          </Dropdown>
          {/* Status */}
          <Dropdown
            className={cn(
              `border-1 min-w-28 justify-between rounded-[2px] border border-default py-1 pr-2`
            )}
            menu={{
              items: riskStatusOptions,
              onClick: value => {
                if (value) {
                  if (value === RiskStatus.Remediated) {
                    setIsClosedSubStateModalOpen(true);
                  } else {
                    setStatus(value as RiskStatus);
                  }
                }
              },
            }}
            startIcon={
              riskStatusOptions.find(option => option.value === riskStatusKey)
                ?.icon ?? <LockClosedIcon className="size-4 stroke-2" />
            }
            endIcon={<ChevronDownIcon className="size-3 text-default-light" />}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex-1 text-left">{statusLabel}</div>
          </Dropdown>
        </div>
      )}
      <ClosedStateModal
        isOpen={isClosedSubStateModalOpen}
        onClose={() => setIsClosedSubStateModalOpen(false)}
        onStatusChange={handleDeleteRisk}
      />
      <InputText
        type={Type.TEXT_AREA}
        name="message"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Write your thoughts here..."
      />

      <div className="mt-2 flex justify-end space-x-2">
        <Button
          onClick={handleSave}
          disabled={isSaving || !isUpdated}
          className="py-2"
          styleType={isUpdated ? 'primary' : 'none'}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
