import React from 'react';

const baseStyles = 'px-4 py-2 rounded-md font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

const variantStyles = {
  primary: 'bg-dark text-white hover:bg-accent focus:ring-dark',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-dark hover:bg-gray-100 focus:ring-dark',
};

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const styles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button onClick={onClick} className={styles} {...props}>
      {children}
    </button>
  );
};

export default Button;
