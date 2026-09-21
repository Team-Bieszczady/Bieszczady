import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "../../../context/useAuthToken";
import { api } from "../../../lib/api";

export function useDeleteFolder(projectId: string){
    const queryClient = useQueryClient();
    const { requireToken } = useAuthToken();
    return useMutation({
      mutationFn: async (folderId: string) => {
        return api.deleteFolder(requireToken(), projectId, folderId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
        queryClient.invalidateQueries({ queryKey: ['trash', projectId] });

      },
    });
}