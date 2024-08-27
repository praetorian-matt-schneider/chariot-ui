import { Modal } from '@/components/Modal';

interface ClosedStateModal {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (data: { status: string }) => void;
}

export const ClosedStateModal = (props: ClosedStateModal) => {
  const { isOpen, onClose, onStatusChange } = props;

  const riskClosedStatusList = [
    {
      value: 'resolved',
      label: 'Mark as Resolved',
      desc: 'This risk has been addressed and resolved; no further action is required.',
    },
    {
      value: 'rejected',
      label: 'Reject the Risk',
      desc: 'We acknowledge the presence of this risk and accept it, understanding the potential impact.',
    },
    {
      value: 'false_positive',
      label: 'False Positive',
      desc: 'This risk is deemed to be a false positive or not valid, and no further action will be taken.',
    },
    {
      value: 'out_of_scope',
      label: 'Out of Scope',
      desc: 'This risk is out of scope and will not be addressed or mitigated.',
    },
  ];

  return (
    <Modal title="Select Reason" open={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {riskClosedStatusList.map((riskClosedStatus, index) => (
          <label
            key={index}
            className="flex cursor-pointer items-center rounded-lg bg-layer2 p-3 transition duration-150 ease-in-out hover:bg-gray-100"
            onClick={() => {
              onStatusChange({
                status: riskClosedStatus.label,
              });
              onClose();
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
