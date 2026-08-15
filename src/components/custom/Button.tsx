interface OperationButtonProps {
  label: string;
  onClick: () => void;
}

export const OperationButton = ({ label, onClick }: OperationButtonProps) => {
  return (
    <div className="operation" onClick={onClick}>
      {label}
    </div>
  );
};
