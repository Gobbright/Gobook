const variantClasses = {
  primary: 'text-white bg-blue-600 border-blue-600',
  ghost: 'text-blue-700 bg-white border-[#dbe4ef]',
};

export function Button({ children, variant = 'primary', ...props }) {
  return (
    <button
      className={`cursor-pointer border rounded-md px-3.5 py-2.5 ${variantClasses[variant] ?? variantClasses.primary}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
