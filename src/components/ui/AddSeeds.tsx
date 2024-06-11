import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { v4 as uuidv4 } from 'uuid';

import { create as createSeed } from '@/hooks/useSeeds';
import { AllowedSeedRegex, GetSeeds } from '@/utils/regex.util';

import { Button } from '../Button';
import { Dropzone, FileResult } from '../Dropzone';
import { Modal } from '../Modal';
import { Tooltip } from '../Tooltip';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSeeds: React.FC<Props> = (props: Props) => {
  const { isOpen, onClose } = props;
  const [seedInput, setSeedInput] = useState<string>('');

  const { mutate: addSeed } = createSeed();

  const handleSubmitSeed = () => {
    if (seedInput.match(AllowedSeedRegex)) {
      try {
        const asset = seedInput;
        addSeed({ asset });
      } catch (error) {
        console.error(error);
      } finally {
        setSeedInput('');
        onClose();
      }
    }
  };

  const handleChange = (result: FileResult): void => {
    onClose();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    const { email, ...restSeedTypes } = GetSeeds(result?.toString() ?? '');

    const seeds = Object.values(restSeedTypes)
      .flatMap(x => x)
      .slice(0, 500);
    const toastId = uuidv4();

    seeds?.forEach(word => {
      try {
        const asset = word;
        addSeed({ asset, toastId, seedsCount: seeds.length });
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Modal title="Add Seeds" open={isOpen} onClose={onClose}>
      <form
        className="flex flex-row items-center"
        onSubmit={event => {
          event.preventDefault();
          handleSubmitSeed();
        }}
      >
        <input
          required
          type="text"
          placeholder="exampledomain.com"
          value={seedInput}
          onChange={e => setSeedInput(e.target.value)}
          className="block w-full rounded-l-[2px] border border-gray-300 bg-layer0 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        />
        <Button
          styleType="primary"
          type="submit"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          className="block h-[42px] w-[150px] items-center rounded-r-[2px] px-6 py-2.5 text-sm"
        >
          Add Seed
        </Button>
      </form>
      <div className="mt-4 flex items-center gap-3 text-sm font-semibold uppercase text-disabled">
        <div className="w-full border-t-2 border-default" />
        or
        <div className="w-full border-t-2 border-default" />
      </div>
      <Dropzone
        onChange={handleChange}
        title={'Bulk Upload'}
        subTitle={`Add a document with a list of Domains, IP addresses, CIDR ranges, or GitHub organizations.`}
        maxFileSizeInMb={6}
        maxFileSizeMessage={
          <div className="flex items-center justify-center gap-1 text-xs italic text-disabled">
            Bulk Uploads Cannot Exceed 500 Seeds or 6MB in file size.
            <Tooltip
              title={
                <div className="max-w-52 px-4 py-2">
                  The Chariot frontend allows 500 Seeds to be added at once. For
                  larger uploads, please use the{' '}
                  <Link
                    to={
                      'https://github.com/praetorian-inc/praetorian-cli/blob/main/README.md'
                    }
                    target={'_blank'}
                    rel={'noreferrer'}
                    className="underline"
                  >
                    Praetorian CLI
                  </Link>
                </div>
              }
              placement="top"
            >
              <Button styleType="none" className="p-0">
                <InformationCircleIcon className="size-4" />
              </Button>
            </Tooltip>
          </div>
        }
      />
    </Modal>
  );
};
