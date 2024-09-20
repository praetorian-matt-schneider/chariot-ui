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
import { RiskCombinedStatus, RiskSeverity, RiskStatus } from '@/types';
import { title } from 'process';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { FormGroup } from '@/components/form/FormGroup';

export const MATERIAL_RISK_DNS = 'material-risk';

const DEFAULT_FORM_VALUE = {
  key: '',
  name: '',
  status: 'O',
  severity: 'I',
  comment: '',
};

export const AddRisks = () => {
  const {
    modal: {
      risk: {
        open: isOpen,
        type,
        onChange,
        selectedAssets,
        onSelectedAssetsChange,
        selectedRisks,
        onSelectedRisksChange,
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

  const handleAddRiskForAssets = async (event: FormEvent) => {
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

  const handleAddMaterialRisk = async (event: FormEvent) => {
    event.preventDefault();
    console.log('done');

    await addRisk({
      comment: '',
      name: formData.name,
      key: `#risk#${MATERIAL_RISK_DNS}#${formData.name.toLocaleLowerCase().split(' ').join('-').replaceAll('#', '')}`,
      status: `OX`,
    });

    if (definition) {
      await uploadFile({
        ignoreSnackbar: true,
        name: `definitions/${formData.name}`,
        content: definition,
      });
    }

    onClose();
  };

  function onClose() {
    onChange(false, 'risk');
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

  const { title, icon, children } =
    type === 'selectorScreen'
      ? {
          title: 'Select Risk Type',
          icon: null,
          children: (
            <div className="flex flex-col gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Add Risk on Asset(s)</div>
                <div>
                  Identify and document a potential vulnerability or issue
                  related to one or more assets in your attack surface.
                </div>
                <Button
                  label="Add Risk"
                  styleType="primary"
                  className="w-full mt-4"
                  onClick={() => onChange(true, 'risk')}
                />
              </div>
              <div className="w-full flex items-center gap-2">
                <div className="w-full h-[1px] bg-gray-500"></div>
                <div>or</div>
                <div className="w-full h-[1px] bg-gray-500"></div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Create Material Risk</div>
                <div>
                  Material risks represent the highest level of severity and may
                  have legal or financial consequences. This action is rare and
                  requires manual review.
                </div>
                <Button
                  label="Create Material Risk"
                  styleType="primary"
                  className="bg-white border-brand border text-brand w-full mt-4"
                  onClick={() => onChange(true, 'material')}
                />
              </div>
            </div>
          ),
        }
      : type === 'material'
        ? {
            title: 'Create Material Risk',
            icon: (
              <ShieldExclamationIcon className="size-6 text-default-light" />
            ),
            children: (
              <div>
                <div className="flex flex-1 flex-col justify-center">
                  <form
                    id="addRisk"
                    onSubmit={handleAddMaterialRisk}
                    className="space-y-4"
                  >
                    <TypeSearch
                      label="Select Risks"
                      types={['risks']}
                      value={{ risks: selectedRisks }}
                      onChange={updatedValue => {
                        onSelectedRisksChange(updatedValue.risks || []);
                      }}
                      placeholder="CVE-2021-1234"
                    />
                    <Inputs
                      inputs={[
                        {
                          label: 'Material Risk Name',
                          value: '',
                          placeholder:
                            'Data Breach and Privilege Escalation Impact',
                          name: 'name',
                          required: true,
                        },
                      ]}
                      onChange={values =>
                        setFormData(formData => ({ ...formData, ...values }))
                      }
                    />
                    <FormGroup label={'Description'} name="Description">
                      <MarkdownEditor
                        value={definition}
                        onChange={value => {
                          setDefinition(value || '');
                        }}
                        preview="edit"
                        filePathPrefix="definitions/files"
                      />
                    </FormGroup>
                    <p className="mt-3 text-center text-xs text-gray-500">
                      Material risks demand immediate attention and will undergo
                      thorough manual review due to their potential impact.
                    </p>
                  </form>
                </div>
              </div>
            ),
          }
        : {
            title: 'Add Risk',
            icon: <RisksIcon className="size-6 text-default-light" />,
            children: (
              <>
                <div>
                  <div className="flex flex-1 flex-col justify-center">
                    <form
                      id="addRisk"
                      onSubmit={handleAddRiskForAssets}
                      className="space-y-4"
                    >
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
                        Manually entered risks will be tracked but not
                        automatically monitored.
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
              </>
            ),
          };

  return (
    <>
      <Modal
        title={title}
        icon={icon}
        open={isOpen}
        onClose={onClose}
        size="lg"
        closeOnOutsideClick={false}
        hideFooter={type === 'selectorScreen'}
        footer={{
          text: 'Add',
          form: 'addRisk',
        }}
      >
        {children}
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
