import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noHover?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({ children, className = '', onClick, noHover = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (noHover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const rY = ((mouseX - width / 2) / width) * 5; // Reduced rotation for subtlety
    const rX = ((mouseY - height / 2) / height) * -5;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`lovable-card rounded-2xl p-6 transition-all duration-300 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX,
        rotateY,
        scale: noHover ? 1 : 1,
      }}
      whileHover={{
        y: noHover ? 0 : -4,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
      }}
    >
      <div style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>
    </motion.div>
  );
};