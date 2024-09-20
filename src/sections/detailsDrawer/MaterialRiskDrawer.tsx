import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Link } from '@/components/Link';
import { Loader } from '@/components/Loader';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { useMy } from '@/hooks';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useUpdateRisk } from '@/hooks/useRisks';
import { StickHeaderSection } from '@/sections/detailsDrawer/AssetDrawer';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import { RiskStatus } from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { Regex } from '@/utils/regex.util';
import { getRiskStatusLabel } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';
import { useGetFile } from '@/hooks/useFiles';
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview';

interface Props {
  open: boolean;
  compositeKey: string;
}

export const MaterialRiskDrawer = ({ compositeKey, open }: Props) => {
  const { removeSearchParams } = useSearchParams();
  const navigate = useNavigate();
  const { getRiskDrawerLink } = getDrawerLink();
  const { mutateAsync: updateRisk, status: updateRiskStatus } = useUpdateRisk();
  const { riskNotification } = useGlobalState();
  const { onChange: setNotification } = riskNotification;

  const { data: attributesGenericSearch } = useGenericSearch(
    {
      query: `source:#risk${compositeKey}`,
      exact: true,
    },
    {
      enabled: open,
    }
  );
  const risks = useMemo(
    () =>
      (attributesGenericSearch?.attributes || [])
        .filter(({ source }) => (source.match(Regex.RISK) || [])?.length > 0)
        .map(({ value, updated, source }) => {
          const [, dns, name] = value.match(Regex.RISK) || [];
          return { dns, name, updated, source };
        }),
    [attributesGenericSearch]
  );

  const sideSectionMinWidth = '300px';

  const { data: materialRisks = [], status: materialRisksStatus } = useMy(
    {
      resource: 'risk',
      query: compositeKey,
    },
    { enabled: open }
  );

  const [, , name] = compositeKey.split('#');

  const { data: definitionsFile, isFetching: isDefinitionsFileFetching } =
    useGetFile(
      {
        name: `definitions/${name}`,
      },
      { enabled: Boolean(open && name) }
    );
  const materialRisk = materialRisks[0] || {};

  const handleClose = () => {
    removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY);
  };

  const handleRemediate = async () => {
    const { severity } = getRiskStatusLabel(materialRisk.status);
    await updateRisk({
      key: materialRisk.key,
      name: materialRisk.name,
      status: `${RiskStatus.Remediated}${severity ? severity : ''}`,
      showSnackbar: true,
      comment: materialRisk.comment,
    });
    // TODO : check if we need to perform some other change
    handleClose();
    setNotification({
      message: `Great work! ${materialRisk.name} has been remediated.`,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      onBack={() => navigate(-1)}
      className={cn('w-full rounded-t-lg pb-0 shadow-lg')}
      contentClassName="flex rounded-t-lg"
    >
      <Loader
        isLoading={
          materialRisksStatus === 'pending' || isDefinitionsFileFetching
        }
        type="spinner"
      >
        <div
          className="grid size-full"
          style={{
            display: 'grid',
            gridTemplateAreas: `'section1 section2'`,
            gridTemplateColumns: `minmax(auto, calc( 100% - ${sideSectionMinWidth})) minmax(${sideSectionMinWidth}, 25%)`,
            gridTemplateRows: '100%',
          }}
        >
          <div
            className="flex w-full flex-col items-center gap-2 overflow-auto px-9 py-5 text-center"
            style={{ gridArea: 'section1' }}
          >
            <h1 className="text-2xl font-bold">Material Risk</h1>
            <h3 className="text-lg font-semibold">{materialRisk.name}</h3>
            <p className="text-sm text-gray-400">{`Created ${formatDate(materialRisk.created)}`}</p>
            <div className="w-1/2">
              <hr />
              <p className="py-2 text-sm font-semibold text-black/60">
                The organization must determine whether a reasonable investor
                would find a cyberimpact meaningful to their investment
                decisions.
              </p>
              <hr />
            </div>
            {definitionsFile && (
              <div className="my-4 w-full">
                <MarkdownPreview className="w-full" source={definitionsFile} />
              </div>
            )}
            {!definitionsFile && (
              <div className="my-4">
                <p className="text-lg font-bold">No Description Found.</p>
              </div>
            )}
            <Button
              styleType="primary"
              startIcon={
                <ShieldExclamationIcon className="size-8 text-white" />
              }
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleRemediate();
              }}
              disabled={updateRiskStatus === 'pending'}
            >
              Mark As Resolved
            </Button>
          </div>
          <div
            className={cn('border-l border-gray-300')}
            style={{ gridArea: 'section2' }}
          >
            <StickHeaderSection label="Contributing Risks">
              {risks.length > 0 &&
                risks.map(risk => (
                  <div
                    className="flex flex-col items-start justify-between gap-4 border-b border-gray-300 p-4 md:flex-row"
                    key={risk.source}
                  >
                    <div>
                      <p
                        className="text-sm text-gray-500"
                        style={{ wordBreak: 'break-word' }}
                      >
                        {risk.dns}
                      </p>
                      <Link
                        to={getRiskDrawerLink({
                          dns: risk.dns,
                          name: risk.name,
                        })}
                        className="hover:text-indigo-600 hover:underline"
                        buttonClass="p-0"
                      >
                        <h2 className="font-semibold text-indigo-500 text-left">
                          {risk.name}
                        </h2>
                      </Link>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(risk.updated)}
                    </span>
                  </div>
                ))}
            </StickHeaderSection>
          </div>
        </div>
      </Loader>
    </Drawer>
  );
};
