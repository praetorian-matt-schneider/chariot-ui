import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';

import { RisksIcon } from '@/components/icons'; // Assuming this is your custom icon

type RiskNotificationBarProps = {
  message: string;
  onClose: () => void;
};

const RiskNotificationBar: React.FC<RiskNotificationBarProps> = ({
  message,
  onClose,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
    }
  }, [message]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(), 300); // Delay onClose to allow exit animation
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          // Full width and minimal shadow to blend with the table
          className="absolute left-[300px] right-0 top-0 z-10 flex items-center justify-between bg-white p-4 "
        >
          <div className="flex items-center">
            <RisksIcon className="size-6 text-blue-500" />
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-800">{message}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="size-6" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RiskNotificationBar;
