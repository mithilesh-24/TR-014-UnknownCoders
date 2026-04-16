import { useState } from "react";

export default function InputField({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="input-container">
      <div className={`input-icon-wrapper ${focused || value ? "text-purple-400" : "text-gray-400"}`}>
        <Icon />
      </div>
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="input-field"
      />
    </div>
  );
}
