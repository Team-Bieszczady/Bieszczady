import type { BackendFolder } from '../../../lib/api';
import { folderList } from '../utils/folderList';

interface Props {
  folders: BackendFolder[];
  folderName: string;
  gains: string[];
  losses: string[];
}

export function AccessChangeNotice({
  folders,
  folderName,
  gains,
  losses,
}: Props) {
  if (gains.length === 0 && losses.length === 0) {
    return (
      <>Nikt nie zyska ani nie straci dostępu do folderu „{folderName}”.</>
    );
  }

  return (
    <>
      {gains.length > 0 && (
        <span className="block">
          Osoby, którym udostępniono {folderList(folders, gains)}, zobaczą też
          folder „{folderName}” razem z całą zawartością.
        </span>
      )}
      {losses.length > 0 && (
        <span className={gains.length > 0 ? 'mt-2 block' : 'block'}>
          Osoby, którym udostępniono {folderList(folders, losses)}, mogą
          przestać widzieć folder „{folderName}”.
        </span>
      )}
    </>
  );
}
