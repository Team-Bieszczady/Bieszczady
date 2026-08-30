import { useMutation } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { fromModuleFlags, type ModuleFlags } from '../../../lib/modules';

export interface AddUserFormInputs {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password: string;
  modules: ModuleFlags;
  role?: string;
  projectId?: string;
}

export function useCreateUser() {
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: (payload: AddUserFormInputs) =>
      api.createUser(requireToken(), {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        modules: fromModuleFlags(payload.modules),
      }),
  });
}
