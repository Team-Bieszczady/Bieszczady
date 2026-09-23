import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "../../../context/useAuthToken";
import { api } from "../../../lib/api";

export function useApproveDocument(projectId: string, folderId: string){
    const queryClient = useQueryClient();
const { requireToken } = useAuthToken();


return useMutation({

mutationFn: async(documentId: string) => {

  return api.approveDocument(requireToken(), projectId, documentId);
},
onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['documents', projectId, folderId],
    });
}
})

}