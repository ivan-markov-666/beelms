export class AdminActivityItemDto {
  occurredAt: string;
  type: 'wiki' | 'user';
  action:
    | 'article_created'
    | 'article_updated'
    | 'user_registered'
    | 'user_deactivated';
  entityId: string;
  entityLabel: string;
  actorLabel: string | null;
}
