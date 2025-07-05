'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.UserProgress = void 0
const typeorm_1 = require('typeorm')
const user_entity_1 = require('./user.entity')
const topic_entity_1 = require('./topic.entity')
let UserProgress = class UserProgress extends typeorm_1.BaseEntity {}
exports.UserProgress = UserProgress
__decorate(
  [(0, typeorm_1.PrimaryColumn)('uuid', { name: 'user_id' }), __metadata('design:type', String)],
  UserProgress.prototype,
  'userId',
  void 0,
)
__decorate(
  [(0, typeorm_1.PrimaryColumn)('uuid', { name: 'topic_id' }), __metadata('design:type', String)],
  UserProgress.prototype,
  'topicId',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.Column)({
      name: 'completed_at',
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata('design:type', Date),
  ],
  UserProgress.prototype,
  'completedAt',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => user_entity_1.User,
      (user) => user.progressRecords,
      { onDelete: 'CASCADE' },
    ),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  UserProgress.prototype,
  'user',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => topic_entity_1.Topic,
      (topic) => topic.progressRecords,
      { onDelete: 'CASCADE' },
    ),
    (0, typeorm_1.JoinColumn)({ name: 'topic_id' }),
    __metadata('design:type', topic_entity_1.Topic),
  ],
  UserProgress.prototype,
  'topic',
  void 0,
)
exports.UserProgress = UserProgress = __decorate(
  [(0, typeorm_1.Entity)('user_progress')],
  UserProgress,
)
//# sourceMappingURL=user-progress.entity.js.map
