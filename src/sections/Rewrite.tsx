import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Rewrite() {
  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  return (
    <div className="relative">
      <motion.div
        className="justify-centertransition-colors relative z-10 flex h-screen w-full flex-col items-center p-20 duration-500"
        style={{ backgroundColor: isOn ? '#1D1537' : '#1D1537' }}
      >
        <div className=" mb-4 w-full text-2xl text-white">
          <div className="w-full">
            <div className="mx-auto w-[400px]">
              <svg
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                viewBox="0 0 1006.94 250.98"
                fill="#fff"
              >
                <path
                  className="st0"
                  d="M137.38,0c75.87,0,137.38,61.51,137.38,137.38c0,47.22-23.83,88.87-60.11,113.6 c-32.72-19.61-58.44-50.25-63.04-84.28c-14.74-2.85-32.55-3.74-45.57,0.16L93.57,127.1l19.06,30.76 c10.76-2.01,22.85-2.04,35.51-0.06c-5.79-4.19-9.42-4.84-18.05-7.61c33.85-0.31,66.95,31.53,72.92,60.46l27.03-2.02l18.58-32.43 c-29.25-30.42-50.43-62.07-52.69-93.34l-56.79-40.44c-2.87,5.74-3.75,11.81-3.55,18.06c-7.68-9.99-0.39-23.64,9.17-41.69 c1.51-2.96,2.51-4.8-4.17-2.63c-18.58,6.05-32.72,17.03-40.99,29.06C40.91,71,12.64,110.42,3.71,148.07l-1.66,13.05 C0.7,153.41,0,145.48,0,137.38C0,61.51,61.51,0,137.38,0L137.38,0z M144.3,43.04l13.58,9.98c1.9-4.4,7.03-10.74,14.63-15.6 c2.74-1.49,3.75-3.32-2.75-2.71C160.5,35.57,149.81,40.8,144.3,43.04L144.3,43.04z M233.49,189.01l-6.23-19.05l-7.73,2.21l0.95,9.47 C225.18,176.03,227.16,183.11,233.49,189.01L233.49,189.01z M141.65,85.57c11.62,6.12,10.78,7.86,11.68,19.33l11.91,7.71l7,1.66 l7.29,7.82C169.69,106.3,162.76,90.81,141.65,85.57z"
                />
                <path
                  className="st0"
                  d="M414.37,153.82l-16.19,20.94h-40.91c-7.06,0-13.6-1.06-19.6-3.17c-6.01-2.11-11.18-5.01-15.52-8.71 c-4.34-3.69-7.75-8.08-10.23-13.15c-2.48-5.07-3.71-10.57-3.71-16.5c0-5.93,1.24-11.34,3.71-16.26c2.48-4.91,5.88-9.13,10.23-12.66 c4.34-3.53,9.52-6.25,15.52-8.16c6.01-1.91,12.54-2.86,19.6-2.86h57.1l-16.19,21.19h-40.91c-3.41,0-6.58,0.49-9.5,1.46 c-2.92,0.97-5.44,2.33-7.55,4.08c-2.11,1.75-3.77,3.84-4.99,6.27c-1.22,2.44-1.83,5.11-1.83,8.04c0,2.92,0.59,5.58,1.77,7.98 c1.18,2.39,2.84,4.44,4.99,6.15c2.15,1.7,4.69,3.02,7.61,3.96c2.92,0.93,6.09,1.4,9.5,1.4H414.37L414.37,153.82z M547.33,174.77 l15.22-20.94h20.46c2.44,0,4.97,0,7.61,0c2.64,0,4.93,0.08,6.88,0.24c-1.14-1.46-2.46-3.31-3.96-5.54c-1.5-2.23-2.94-4.32-4.32-6.27 l-14.61-21.55l-38.23,54.06h-29.83l52.23-73.66c1.7-2.35,3.86-4.46,6.45-6.33c2.6-1.87,5.88-2.8,9.86-2.8c3.81,0,7,0.87,9.56,2.62 c2.56,1.75,4.73,3.92,6.51,6.51l50.89,73.66H547.33L547.33,174.77z M1006.94,93.31l-16.32,21.19h-29.1v60.27h-25.2V114.5h-38.23 l16.32-21.19H1006.94L1006.94,93.31z M840.17,91.97c-19.89,0-34.78,3.37-44.68,10.11c-9.9,6.74-14.85,17.37-14.85,31.9 c0,14.61,4.93,25.28,14.79,32.02c9.86,6.74,24.78,10.11,44.75,10.11c19.89,0,34.78-3.37,44.69-10.11 c9.9-6.74,14.85-17.41,14.85-32.02c0-14.53-4.97-25.16-14.92-31.9C874.85,95.34,859.97,91.97,840.17,91.97L840.17,91.97z  M840.17,154.92c-6.33,0-11.69-0.26-16.07-0.79c-4.38-0.53-7.93-1.56-10.65-3.1c-2.72-1.54-4.69-3.67-5.91-6.39 c-1.22-2.72-1.83-6.27-1.83-10.65c0-4.38,0.61-7.93,1.83-10.65c1.22-2.72,3.19-4.83,5.91-6.33c2.72-1.5,6.27-2.52,10.65-3.04 c4.38-0.53,9.74-0.79,16.07-0.79c6.33,0,11.69,0.26,16.07,0.79c4.38,0.53,7.93,1.54,10.65,3.04c2.72,1.5,4.69,3.61,5.91,6.33 c1.22,2.72,1.83,6.27,1.83,10.65c0,4.38-0.61,7.93-1.83,10.65c-1.22,2.72-3.19,4.85-5.91,6.39c-2.72,1.54-6.27,2.58-10.65,3.1 C851.86,154.66,846.5,154.92,840.17,154.92L840.17,154.92z M772.8,174.77h-25.2V93.31h25.2V174.77L772.8,174.77z M741.39,174.77 l-14.98-15.83c-2.84-2.84-5.11-5.07-6.82-6.7c-1.71-1.62-3.25-2.96-4.63-4.02c3.33-0.65,6.31-1.76,8.95-3.35 c2.64-1.58,4.87-3.51,6.7-5.78c1.83-2.27,3.23-4.83,4.2-7.67c0.97-2.84,1.46-5.84,1.46-9.01c0-5.84-1.32-10.63-3.96-14.37 c-2.64-3.73-5.99-6.7-10.04-8.89c-4.06-2.19-8.56-3.71-13.51-4.57c-4.95-0.85-9.74-1.28-14.37-1.28h-52.36l-16.44,21.19h70.86 c4.38,0,7.79,0.79,10.23,2.37c2.43,1.58,3.65,3.96,3.65,7.12c0,2.84-1.34,5.07-4.02,6.7c-2.68,1.62-5.97,2.44-9.86,2.44h-70.86v7.69 l23.46,33.95h1.75v-21.55h38.72l18.14,21.55H741.39L741.39,174.77z M499.49,174.77l18.59-26.21V93.31H493v28.86h-48.46V93.31h-25.33 v81.46h25.33v-31.41H493v31.41H499.49z"
                />
              </svg>
            </div>
          </div>
        </div>

        <motion.div
          className={`relative mb-20 flex h-10 w-20 cursor-pointer items-center rounded-full bg-gray-800 px-1 ${
            isOn ? 'justify-end' : 'justify-start'
          }`}
          onClick={toggleSwitch}
          transition={{ duration: 2.5 }} // Slower transition for impact
        >
          <motion.div
            className="relative flex size-8 items-center justify-center rounded-full bg-yellow-400 shadow-inner"
            layout
            transition={{ type: 'spring', stiffness: 700, damping: 30 }}
            animate={{ rotate: isOn ? 0 : 360 }} // Slowed down and adjusted for rotation
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="30"
              height="30"
            >
              <motion.circle
                cx="50"
                cy="50"
                r="0"
                stroke="black"
                strokeWidth="5"
                fill="yellow"
                layout
              />
              <motion.circle
                cx="35"
                cy="35"
                r="5"
                fill="black"
                layout
                animate={{ scale: isOn ? 1 : 1.5 }} // Eye scaling
              />
              <motion.circle
                cx="65"
                cy="35"
                r="5"
                fill="black"
                layout
                animate={{ scale: isOn ? 1 : 1.5 }}
              />
              <motion.path
                d={isOn ? 'M 35 60 Q 50 75 65 60' : 'M 35 65 Q 50 50 65 65'}
                stroke="black"
                strokeWidth="5"
                fill="transparent"
                layout
                transition={{ type: 'spring', stiffness: 500 }}
              />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute top-[300px] mb-4 w-full justify-center text-2xl text-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: isOn ? 0 : 1 }}
        >
          <div className="absolute left-1/4 right-0 z-10 flex w-1/2 flex-wrap justify-center gap-4">
            <OnFireLogo src="/icons/kubernetes.svg" />
            <OnFireLogo src="/icons/GoogleCloud.svg" />
            <OnFireLogo src="/icons/mysql.svg" />
            <OnFireLogo src="/icons/kafka.svg" />
            <OnFireLogo src="/icons/redis.svg" />
            <OnFireLogo src="/icons/istio.svg" />
            <OnFireLogo src="/icons/benthos.png" />
            <OnFireLogo src="/icons/argo.png" />
          </div>
        </motion.div>
        <motion.div
          className="mb-4 w-full text-2xl text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: isOn ? 1 : 0 }}
        >
          <div className="absolute left-1/4 right-0 z-10 flex w-1/2 flex-wrap justify-center gap-4">
            <img src="/icons/lambda.svg" className="size-24  invert" />
            <img src="/icons/DynamoDB.png" className="size-24" />
            <img src="/icons/sqs.svg" className="size-24" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

const OnFireLogo: React.FC<{ src: string }> = ({ src }) => {
  return (
    <div className="relative flex size-32 items-center justify-center">
      {/* Kubernetes Logo */}
      <img src={src} className="size-20" />

      {/* Fire Animation */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: [0, 5, -5, 3, -3, 0], // Subtle rotation back and forth
          scale: [1, 1.08, 0.98, 1.1, 0.9, 1], // Slight scaling in and out
          skew: [0, 2, -2, 1, -1, 0], // Small skew effects
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <img src="/icons/fire.svg" className="size-24 opacity-80" />
      </motion.div>
    </div>
  );
};
