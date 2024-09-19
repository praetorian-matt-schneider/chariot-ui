import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface TransitionScreenProps {
  message?: string;
  onComplete: () => void;
}

const TransitionScreen: React.FC<TransitionScreenProps> = ({
  message,
  onComplete,
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Give time for fade-out to complete
    }, 1500); // Total time for transition
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-black/70 transition-opacity duration-500 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        zIndex: 1000,
      }}
    >
      <div className="relative flex size-24 items-center justify-center">
        {/* First User Profile Icon */}
        <motion.div
          initial={{ x: -20, opacity: 1 }}
          animate={{ x: 20, opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
          className="absolute"
        >
          <User className="size-12 text-gray-500" />
        </motion.div>

        {/* Second User Profile Icon */}
        <motion.div
          initial={{ x: 20, opacity: 1 }}
          animate={{ x: -20, opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
          className="absolute"
        >
          <User className="size-12 text-gray-400" />
        </motion.div>
      </div>
      <div className="text-2xl font-bold text-white">
        {message || 'Switching accounts, please wait...'}
      </div>
    </div>
  );
};

export default TransitionScreen;
