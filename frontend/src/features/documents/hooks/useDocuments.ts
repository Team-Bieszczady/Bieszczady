import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAuthToken } from "../../../context/useAuthToken";

export function useDocuments(projectId: string, folderId: string | null){
  const { hasToken, requireToken } = useAuthToken();
return useQuery({

    queryKey: ['documents', projectId, folderId],
    queryFn: async () => {
       
return await api.getDocuments(requireToken(), projectId, folderId!);

    },
  
  enabled: hasToken && !!folderId
})

}