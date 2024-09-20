import confetti from 'canvas-confetti';
import { toast } from 'sonner';

import { Modal } from '@/components/Modal';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useDeleteRisk, useUpdateRisk } from '@/hooks/useRisks';
import { Risk, RiskStatus } from '@/types';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { Dropdown } from '@/components/Dropdown';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Tooltip } from '@/components/Tooltip';

interface ClosedStateModal {
  risk: Risk;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  type?: 'dropdown' | 'dropdownWithNoButton';
}

export const riskClosedStatusList = [
  {
    value: 'resolved',
    label: 'Mark as Resolved',
    desc: 'This risk has been addressed and resolved; no further action is required.',
    status: RiskStatus.Remediated,
  },
  {
    value: 'rejected',
    label: 'Reject the Risk',
    desc: 'We acknowledge the presence of this risk and accept it, understanding the potential impact.',
    status: RiskStatus.DeletedRisks,
  },
  {
    value: 'false_positive',
    label: 'False Positive',
    desc: 'This risk is deemed to be a false positive or not valid, and no further action will be taken.',
    status: RiskStatus.DeletedRisks,
  },
  {
    value: 'out_of_scope',
    label: 'Out of Scope',
    desc: 'This risk is out of scope and will not be addressed or mitigated.',
    status: RiskStatus.DeletedRisks,
  },
];

export const ClosedStateModal = (props: ClosedStateModal) => {
  const { isOpen, onClose, onSuccess, risk } = props;
  const { severity } = getRiskStatusLabel(risk?.status);
  const { mutate: updateRisk } = useUpdateRisk();
  const { mutate: deleteRisk } = useDeleteRisk();
  const { data: risksGeneric } = useGenericSearch({
    query: 'status:R',
  });

  const handleStatusChange = async ({
    status,
    comment,
  }: {
    status?: RiskStatus;
    comment: string;
  }) => {
    if (status === RiskStatus.Remediated) {
      const isFirstRemediatedRisk = (risksGeneric?.risks || []).length === 0;
      await updateRisk({
        key: risk.key,
        name: risk.name,
        status: `${status}${severity}`,
        comment,
      });
      onSuccess(`Great work! ${risk.name} has been remediated.`);
      if (isFirstRemediatedRisk) {
        confetti({
          particleCount: 150,
          spread: 60,
        });
        toast.success('Onboarding complete', {
          description:
            'All the onboarding steps have successfully been completed.',
        });
      }
    } else {
      await deleteRisk([{ ...risk, comment }]);
      onSuccess(`${risk.name} has been closed.`);
    }
  };

  if (props.type === 'dropdown' || props.type === 'dropdownWithNoButton') {
    return (
      <Tooltip placement="top" title="Close the Risk">
        <div>
          <Dropdown
            menu={{
              items: [
                { label: 'Select Reason for Closing', type: 'label' },
                { label: '', type: 'divider' },
                ...riskClosedStatusList.map(riskClosedStatus => {
                  return {
                    label: riskClosedStatus.label,
                    value: riskClosedStatus.value,
                    tooltip: riskClosedStatus.desc,
                    onClick: () => {
                      handleStatusChange({
                        status: riskClosedStatus.status,
                        comment: riskClosedStatus.label,
                      });
                    },
                  };
                }),
              ],
            }}
            styleType={
              props.type === 'dropdownWithNoButton' ? 'secondary' : 'none'
            }
            className={props.type === 'dropdownWithNoButton' ? 'h-8' : 'p-2'}
            onClick={event => {
              event?.stopPropagation();
            }}
            label={props.type === 'dropdownWithNoButton' ? 'No' : ''}
            endIcon={
              props.type === 'dropdown' && (
                <EllipsisVerticalIcon className="size-5" />
              )
            }
          />
        </div>
      </Tooltip>
    );
  }
  return (
    <Modal title="Select Reason" open={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {riskClosedStatusList.map((riskClosedStatus, index) => (
          <label
            key={index}
            className="flex cursor-pointer items-center rounded-lg bg-layer2 p-3 transition duration-150 ease-in-out hover:bg-gray-100"
            onClick={() => {
              handleStatusChange({
                status: riskClosedStatus.status,
                comment: riskClosedStatus.label,
              });
            }}
          >
            <input
              type="radio"
              name="closedSubState"
              value={riskClosedStatus.value}
              className="form-radio size-5 text-indigo-600 transition duration-150 ease-in-out"
            />
            <div className="ml-3 text-sm">
              <span className="font-medium text-gray-900">
                {riskClosedStatus.label}
              </span>
              <span className="block text-gray-500">
                {riskClosedStatus.desc}
              </span>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
};
