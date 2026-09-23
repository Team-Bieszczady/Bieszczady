import { useState } from "react";
import type { BackendFolder } from "../../../lib/api";
import { Modal } from "../../../components/ui/Modal";
import { FIELD_LABEL_CLASSES } from "../../../components/ui/formStyles";
import { Select, type SelectOption } from "../../../components/ui/Select";
import { Button } from '../../../components/ui/Button';


interface Props {
  documentId: string | null;
  folders: BackendFolder[];
  isPending: boolean;
  onSubmit: (folderId: string) => void;
  onClose: () => void;
}

export function RestoreDocumentModal({documentId, folders,isPending,onSubmit, onClose}: Props) {
const [restoreFolderId, setRestoreFolderId] = useState('');
const folderOptions: SelectOption[] = folders.map((folder) => ({
    value: folder.id,
    label: folder.name
}))

const submit = () => {
  if (restoreFolderId === '') {
    return;
  }
  onSubmit(restoreFolderId);
};


return(
     <Modal
            isOpen={documentId !== null}
            onClose={onClose}
            title="Przywróć dokument"
          >
            <div className="space-y-5">
              <p className="text-sm text-dark/75">
                Folder tego dokumentu został usunięty. Wybierz, gdzie go przywrócić.
              </p>
    
              <div>
                <label className={FIELD_LABEL_CLASSES}>
                  Folder <span className="text-red-500">*</span>
                </label>
                <Select
                  size="md"
                  options={folderOptions}
                  value={restoreFolderId}
                  onChange={(v) => setRestoreFolderId(v)}
                  placeholder="Wybierz"
                />
              </div>
    
              <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  size="small"
                  type="button"
                  onClick={onClose}
                >
                  Anuluj
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={submit}
                  disabled={restoreFolderId === ''}
                  isPending={isPending}
                  className="font-medium!"
                >
                  Przywróć
                </Button>
              </div>
            </div>
          </Modal>
)

}
