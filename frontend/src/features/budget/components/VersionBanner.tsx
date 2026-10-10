import { useState, type ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/useAuth';
import { formatDate, formatTime } from '../../people/utils/formatDateTime';
import {
  canApproveAnnexes,
  latestApproved,
  openAnnex,
  type BudgetAction,
} from '../budgetReducer';
import type { BudgetStore, BudgetVersion } from '../types';
import type { VersionDiff } from '../utils/budgetTotals';
import { AnnexReviewPanel } from './AnnexReviewPanel';
import { ApproveAnnexModal } from './ApproveAnnexModal';
import { CommentModal } from './CommentModal';

type Dialog = 'approve' | 'reject' | 'revert' | 'discard' | 'metadata';

interface VersionBannerProps {
  store: BudgetStore;
  version: BudgetVersion;
  previous: BudgetVersion | null;
  diff: VersionDiff | null;
  dispatch: (action: BudgetAction) => void;
}

const NO_CHANGES = 'Brak zmian względem obowiązującej wersji';

function Banner({
  tone,
  children,
}: {
  tone: 'info' | 'amber';
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-xs ${
        tone === 'amber'
          ? 'bg-amberSoft text-amberDark'
          : 'bg-lightGreen/60 text-darkGreen'
      }`}
    >
      {children}
    </div>
  );
}

export function VersionBanner({
  store,
  version,
  previous,
  diff,
  dispatch,
}: VersionBannerProps) {
  const { user } = useAuth();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const canApprove = canApproveAnnexes(user);
  const hasChanges = diff?.hasChanges ?? false;
  const versionId = version.id;
  const lastRejection = version.rejections.at(-1);
  const showRejection =
    version.status === 'DRAFT' &&
    lastRejection !== undefined &&
    lastRejection.at > (version.submittedAt ?? '');
  const canApproveOwnDraft =
    canApprove &&
    version.status === 'DRAFT' &&
    version.createdBy.id === user?.id;
  const canRevert =
    canApprove &&
    version.status === 'APPROVED' &&
    version.number > 0 &&
    latestApproved(store).id === version.id &&
    openAnnex(store) === null;
  const close = () => setDialog(null);

  const disabledHint = (button: ReactNode) =>
    hasChanges ? button : <span title={NO_CHANGES}>{button}</span>;

  const approveButton = disabledHint(
    <Button
      type="button"
      size="small"
      disabled={!hasChanges}
      onClick={() => setDialog('approve')}
    >
      Zatwierdź
    </Button>,
  );

  return (
    <div className="mb-4 space-y-3">
      {showRejection && (
        <div
          role="status"
          className="rounded-lg border border-darkRed/30 bg-darkRed/5 px-4 py-3"
        >
          <p className="text-xs font-semibold text-darkRed">
            Aneks odrzucony przez {lastRejection.by.name} ·{' '}
            {formatDate(lastRejection.at)}, {formatTime(lastRejection.at)}
          </p>
          <p className="mt-1 text-sm text-dark">„{lastRejection.comment}”</p>
        </div>
      )}

      {version.status === 'DRAFT' && (
        <Banner tone="amber">
          <p>
            Edytujesz roboczy <strong>{version.name}</strong>. Obowiązujący
            budżet się nie zmienia.
            {version.savedAt && (
              <span className="ml-2 text-amberDark/80">
                Zapisano o {formatTime(version.savedAt)}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={() => setDialog('discard')}
            >
              Odrzuć wersję roboczą
            </Button>
            {canApproveOwnDraft
              ? approveButton
              : disabledHint(
                  <Button
                    type="button"
                    size="small"
                    disabled={!hasChanges}
                    onClick={() => dispatch({ type: 'SUBMIT', versionId })}
                  >
                    Wyślij do akceptacji
                  </Button>,
                )}
          </div>
        </Banner>
      )}

      {version.status === 'PENDING' && (
        <Banner tone="amber">
          <p>
            <strong>{version.name}</strong> czeka na akceptację.
          </p>
        </Banner>
      )}

      {version.status !== 'APPROVED' && previous && diff && (
        <AnnexReviewPanel
          store={store}
          version={version}
          previous={previous}
          diff={diff}
          actions={
            version.status === 'PENDING' && canApprove ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => setDialog('reject')}
                >
                  Odrzuć
                </Button>
                {approveButton}
              </>
            ) : null
          }
        />
      )}

      {version.status === 'APPROVED' && (
        <Banner tone="info">
          <div className="min-w-0 space-y-1">
            <p className="font-semibold">
              {version.isCurrent
                ? 'Obowiązująca wersja budżetu. Faktury, wydatki i statusy wpisujesz tutaj, bez aneksu.'
                : 'Wersja archiwalna, tylko do odczytu. Błędy poprawia się kolejnym aneksem.'}
            </p>
            {version.approvedAt && (
              <p className="text-sm font-medium text-dark">
                Data zatwierdzenia aneksu: {formatDate(version.approvedAt)}
              </p>
            )}
            {version.description && (
              <p className="text-[11px] text-dark/60">{version.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={() => setDialog('metadata')}
            >
              Edytuj opis
            </Button>
            {canRevert && (
              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={() => setDialog('revert')}
                className="border-darkRed text-darkRed hover:bg-red-50"
              >
                Cofnij zatwierdzenie
              </Button>
            )}
          </div>
        </Banner>
      )}

      {dialog === 'approve' && (
        <ApproveAnnexModal
          title={`Zatwierdź ${version.name}`}
          submitLabel="Zatwierdź"
          approvedAt={null}
          initial={null}
          onClose={close}
          onSubmit={(metadata) =>
            dispatch({ type: 'APPROVE', versionId, ...metadata })
          }
        />
      )}

      {dialog === 'metadata' && (
        <ApproveAnnexModal
          title={version.name}
          submitLabel="Zapisz"
          approvedAt={version.approvedAt}
          initial={{ description: version.description }}
          onClose={close}
          onSubmit={(metadata) =>
            dispatch({ type: 'EDIT_METADATA', versionId, ...metadata })
          }
        />
      )}

      {dialog === 'reject' && (
        <CommentModal
          title={`Odrzuć ${version.name}`}
          label="Komentarz dla autora"
          hint="Aneks wróci do wersji roboczej, a komentarz będzie widoczny na górze."
          submitLabel="Odrzuć"
          requiredMessage="Komentarz jest wymagany"
          onClose={close}
          onSubmit={(comment) =>
            dispatch({ type: 'REJECT', versionId, comment })
          }
        />
      )}

      {dialog === 'revert' && (
        <CommentModal
          title={`Cofnij zatwierdzenie: ${version.name}`}
          label="Powód"
          hint="Aneks wróci do wersji roboczej, a obowiązywać zacznie poprzednia wersja. Zdarzenie trafi do historii zmian."
          submitLabel="Cofnij zatwierdzenie"
          requiredMessage="Podaj powód"
          onClose={close}
          onSubmit={(reason) =>
            dispatch({ type: 'REVERT_APPROVAL', versionId, reason })
          }
        />
      )}

      <ConfirmDialog
        isOpen={dialog === 'discard'}
        onClose={close}
        onConfirm={() => {
          dispatch({ type: 'DISCARD_DRAFT', versionId });
          close();
        }}
        title="Odrzuć wersję roboczą"
        description={`${version.name} zostanie usunięty. W historii zmian zostanie tylko krótka notatka.`}
        confirmLabel="Odrzuć"
        tone="danger"
      />
    </div>
  );
}
