import React, { FormEvent, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { RisksIcon } from '@/components/icons';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { Modal } from '@/components/Modal';
import { riskSeverityOptions } from '@/components/ui/RiskDropdown';
import { useUploadFile } from '@/hooks';
import { useCreateRisk } from '@/hooks/useRisks';
import { parseKeys, TypeSearch } from '@/sections/SearchByType';
import { useGlobalState } from '@/state/global.state';
import { RiskCombinedStatus } from '@/types';

const DEFAULT_FORM_VALUE = {
  key: '',
  name: '',
  status: 'T',
  severity: 'I',
  comment: '',
};

export const AddRisks = () => {
  const {
    modal: {
      risk: {
        open: isOpen,
        onOpenChange,
        selectedAssets,
        onSelectedAssetsChange,
      },
    },
  } = useGlobalState();

  const [isDefinitionOpen, setIsDefinitionOpen] = useState(false);
  const [definition, setDefinition] = useState('');

  const [isPOEOpen, setIsPOEOpen] = useState(false);
  const [poe, setPOE] = useState('');

  const [formData, setFormData] = useState(DEFAULT_FORM_VALUE);

  const { mutateAsync: addRisk } = useCreateRisk();
  const { mutateAsync: uploadFile } = useUploadFile();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPromise: Promise<any>[] = selectedAssets?.flatMap(assetKey => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api: Promise<any>[] = [
        addRisk({
          ...formData,
          key: assetKey,
          status:
            `${formData.status}${formData.severity}` as RiskCombinedStatus,
        }),
      ];

      if (poe) {
        api.push(
          uploadFile({
            ignoreSnackbar: true,
            name: `${parseKeys.assetKey(assetKey).dns}/${formData.name}`,
            content: poe,
          })
        );
      }

      return api;
    });

    if (definition) {
      allPromise.push(
        uploadFile({
          ignoreSnackbar: true,
          name: `definitions/${formData.name}`,
          content: definition,
        })
      );
    }

    await Promise.all(allPromise);

    onClose();
  };

  function onClose() {
    onOpenChange(false);
  }

  function cleanUp() {
    onSelectedAssetsChange([]);
    setFormData(DEFAULT_FORM_VALUE);
    setIsDefinitionOpen(false);
    setIsPOEOpen(false);
    setPOE('');
    setDefinition('');
  }

  useEffect(() => {
    if (isOpen) {
      return () => {
        cleanUp();
      };
    }
  }, [isOpen]);

  return (
    <>
      <Modal
        title="Add Risk"
        icon={<RisksIcon className="size-6 text-default-light" />}
        open={isOpen}
        onClose={onClose}
        size="lg"
        closeOnOutsideClick={false}
        footer={{
          text: 'Add',
          form: 'addRisk',
        }}
      >
        <div>
          <div className="flex flex-1 flex-col justify-center">
            <form id="addRisk" onSubmit={handleSubmit} className="space-y-4">
              <TypeSearch
                label="Select Assets"
                types={['assets']}
                value={{ assets: selectedAssets }}
                onChange={updatedValue => {
                  onSelectedAssetsChange(updatedValue.assets || []);
                }}
                placeholder="8.8.8.8"
              />
              <Inputs
                inputs={[
                  {
                    label: 'Risk Name',
                    value: '',
                    placeholder: 'CVE-2021-1234',
                    name: 'name',
                    required: true,
                  },
                  {
                    label: 'Severity',
                    name: 'severity',
                    value: 'I',
                    options: riskSeverityOptions,
                    type: Input.Type.SELECT,
                  },
                  {
                    label: 'Comment',
                    name: 'comment',
                    value: '',
                    placeholder: 'Add some optional comments',
                    type: Input.Type.TEXT_AREA,
                  },
                  {
                    name: '',
                    value: '',
                    children: (
                      <div className="flex justify-around">
                        <Button
                          startIcon={<PlusIcon className="size-5" />}
                          styleType="secondary"
                          label="Proof of Exploit"
                          onClick={() => setIsPOEOpen(true)}
                        />
                        <Button
                          startIcon={<PlusIcon className="size-5" />}
                          styleType="secondary"
                          label="Description & Remediation"
                          onClick={() => setIsDefinitionOpen(true)}
                        />
                      </div>
                    ),
                  },
                ]}
                onChange={values =>
                  setFormData(formData => ({ ...formData, ...values }))
                }
              />
              <p className="mt-3 text-center text-xs text-gray-500">
                Manually entered risks will be tracked but not automatically
                monitored.
              </p>
            </form>
          </div>
        </div>
        <AddDefinition
          open={isDefinitionOpen}
          onOpenChange={setIsDefinitionOpen}
          value={definition}
          onValueChange={setDefinition}
        />
        <AddProofOfExploit
          open={isPOEOpen}
          onOpenChange={setIsPOEOpen}
          value={poe}
          onValueChange={setPOE}
        />
      </Modal>
    </>
  );
};

interface AddDefinitionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
}

function AddDefinition(props: AddDefinitionProps) {
  const [definition, setDefinition] = useState(props.value || '');

  useEffect(() => {
    if (props.open) {
      setDefinition(props.value || '');
      return () => {
        setDefinition('');
      };
    }
  }, [props.open]);

  return (
    <Modal
      size="6xl"
      open={props.open}
      onClose={() => {
        props.onOpenChange(false);
      }}
      title="Description & Remediation"
      footer={{
        text: 'Save',
        onClick: async () => {
          props.onValueChange(definition);
          props.onOpenChange(false);
        },
      }}
    >
      <div className="h-[60vh]">
        <MarkdownEditor
          value={definition}
          onChange={value => {
            setDefinition(value || '');
          }}
          filePathPrefix="definitions/files"
        />
      </div>
    </Modal>
  );
}

interface AddProofOfExploitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
}

function AddProofOfExploit(props: AddProofOfExploitProps) {
  const [poe, setPoe] = useState(props.value || '');

  useEffect(() => {
    if (props.open) {
      setPoe(props.value || '');
      return () => {
        setPoe('');
      };
    }
  }, [props.open]);

  return (
    <Modal
      size="6xl"
      open={props.open}
      onClose={() => {
        props.onOpenChange(false);
      }}
      title="Proof of Exploit"
      footer={{
        text: 'Save',
        onClick: async () => {
          props.onValueChange(poe);
          props.onOpenChange(false);
        },
      }}
    >
      <div className="h-[60vh]">
        <MarkdownEditor
          value={poe}
          onChange={value => {
            setPoe(value || '');
          }}
          filePathPrefix="proof-of-exploit/files"
        />
      </div>
    </Modal>
  );
}
