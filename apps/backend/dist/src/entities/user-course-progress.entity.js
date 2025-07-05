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
exports.UserCourseProgress = void 0
const typeorm_1 = require('typeorm')
const user_entity_1 = require('./user.entity')
const course_entity_1 = require('./course.entity')
let UserCourseProgress = class UserCourseProgress extends typeorm_1.BaseEntity {}
exports.UserCourseProgress = UserCourseProgress
__decorate(
  [(0, typeorm_1.PrimaryColumn)('uuid', { name: 'user_id' }), __metadata('design:type', String)],
  UserCourseProgress.prototype,
  'userId',
  void 0,
)
__decorate(
  [(0, typeorm_1.PrimaryColumn)('uuid', { name: 'course_id' }), __metadata('design:type', String)],
  UserCourseProgress.prototype,
  'courseId',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'completed_topics', type: 'int', default: 0 }),
    __metadata('design:type', Number),
  ],
  UserCourseProgress.prototype,
  'completedTopics',
  void 0,
)
__decorate(
  [(0, typeorm_1.Column)({ name: 'total_topics', type: 'int' }), __metadata('design:type', Number)],
  UserCourseProgress.prototype,
  'totalTopics',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'progress_percentage', type: 'int', default: 0 }),
    __metadata('design:type', Number),
  ],
  UserCourseProgress.prototype,
  'progressPercentage',
  void 0,
)
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  UserCourseProgress.prototype,
  'updatedAt',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => user_entity_1.User,
      (user) => user.courseProgressRecords,
      { onDelete: 'CASCADE' },
    ),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  UserCourseProgress.prototype,
  'user',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => course_entity_1.Course,
      (course) => course.courseProgressRecords,
      { onDelete: 'CASCADE' },
    ),
    (0, typeorm_1.JoinColumn)({ name: 'course_id' }),
    __metadata('design:type', course_entity_1.Course),
  ],
  UserCourseProgress.prototype,
  'course',
  void 0,
)
exports.UserCourseProgress = UserCourseProgress = __decorate(
  [(0, typeorm_1.Entity)('user_course_progress')],
  UserCourseProgress,
)
//# sourceMappingURL=user-course-progress.entity.js.map
