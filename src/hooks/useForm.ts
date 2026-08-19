import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

type formChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;
interface FormPayload<T> {
  e: formChangeEvent;
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
}

const handleOnChange = <T>({ e, form, setForm }: FormPayload<T>) => {
  const { name, value } = e.target;
  setForm({
    ...form,
    [name]: value,
  });
};

const useForm = <T>(initialState: T) => {
  const [form, setForm] = useState(initialState);
  return {
    form,
    setForm,
    handleOnChange: (e: formChangeEvent) =>
      handleOnChange({ e, setForm, form }),
  };
};

export default useForm;
