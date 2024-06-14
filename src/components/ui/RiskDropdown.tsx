import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { useUpdateRisk } from '@/hooks/useRisks';
import { getSeverityClass } from '@/utils/risk.util';

import {
  Risk,
  RiskSeverity,
  RiskStatus,
  RiskStatusSub,
  SeverityDef,
  StatusDef,
  StatusSubDef,
} from '../../types';
import { Dropdown } from '../Dropdown';
import { Snackbar } from '../Snackbar';

interface Props {
  risk: Risk;
  className?: string;
  type?: 'status' | 'severity';
  selectedRowsData?: Risk[];
}

const RiskStatusOptions = [
  { label: 'Triage', value: 'T' },
  {
    label: 'Open',
    value: 'O',
  },
  {
    label: 'Closed',
    value: 'C',
    states: [
      { label: 'Accepted', value: 'A' },
      { label: 'Rejected', value: 'R' },
    ],
  },
];

export const RiskSeverityOptions = [
  { label: 'Info', value: 'I' },
  { label: 'Low', value: 'L' },
  { label: 'Medium', value: 'M' },
  { label: 'High', value: 'H' },
  { label: 'Critical', value: 'C' },
];

export const riskStatusOptions = RiskStatusOptions.map(option => {
  let states = [{ label: option.label, value: option.value }];
  if (option.states) {
    states = [
      ...states,
      ...option.states.map(state => ({
        label: option.label + ' - ' + state.label,
        value: option.value + state.value,
      })),
    ];
    states.push();
  }

  return states;
}).flat();

export const RiskDropdown: React.FC<Props> = ({
  risk,
  className,
  type = 'severity',
  selectedRowsData,
}: Props) => {
  const data =
    selectedRowsData && selectedRowsData.length > 1 ? selectedRowsData : [risk];
  const { mutate: updateRisk } = useUpdateRisk();

  function handleStatusChange(value: RiskStatus) {
    data.forEach(item => {
      const riskComposite = item.key.split('#');
      const finding = riskComposite[4];

      updateRisk(
        // asset.Key for POST, risk.Key for PUT
        {
          key: item.key,
          name: finding,
          status: value,
          comment: item.comment,
          showSnackbar: data.length === 1,
        },
        {
          onSuccess: () => {
            if (data.length > 1) {
              Snackbar({
                title: `${data.length} risks updated`,
                description: 'All the risk has been successfully updated.',
                variant: 'success',
              });
            }
          },
        }
      );
    });
  }

  const riskStatusKey = risk.status?.[0] as RiskStatus;
  const riskSeverityKey = risk.status?.[1] as RiskSeverity;
  const riskSubStatusKey = risk.status?.[2] as RiskStatusSub;
  const statusLabel =
    riskSubStatusKey && StatusSubDef[riskSubStatusKey]
      ? `${StatusDef[riskStatusKey]} - ${StatusSubDef[riskSubStatusKey]}`
      : StatusDef[riskStatusKey];

  if (type === 'status') {
    return (
      <Dropdown
        className={` justify-between rounded-[2px] py-1 ${className} border-1 border border-gray-200`}
        menu={{
          items: riskStatusOptions,
          onClick: value => {
            if (value) {
              if (value.length === 1) {
                const newStatus = `${value}${riskSeverityKey}`;
                handleStatusChange(newStatus as RiskStatus);
                return;
              } else {
                const status = value[0];
                const substate = value[1];
                const newStatus = `${status}${riskSeverityKey}${substate}`;
                handleStatusChange(newStatus as RiskStatus);
                return;
              }
            }
          },
        }}
        label={statusLabel}
        endIcon={<ChevronDownIcon className="ml-1 size-3" />}
        onClick={event => event.stopPropagation()}
      />
    );
  }

  return (
    <Dropdown
      className={`justify-between rounded-[2px] py-1 ${getSeverityClass(riskSeverityKey)} ${className} border-1 border`}
      menu={{
        items: RiskSeverityOptions,
        onClick: value => {
          if (value) {
            const oldStatus = risk.status;
            const newStatus = `${oldStatus[0]}${value}${oldStatus[2] ?? ''}`;

            handleStatusChange(newStatus as RiskStatus);
          }
        },
      }}
      label={SeverityDef[riskSeverityKey]}
      endIcon={<ChevronDownIcon className="ml-1 size-3" />}
      onClick={event => event.stopPropagation()}
    />
  );
};
