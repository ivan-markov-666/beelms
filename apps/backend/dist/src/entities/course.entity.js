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
exports.Course = void 0
const typeorm_1 = require('typeorm')
const base_entity_1 = require('./base.entity')
const category_entity_1 = require('./category.entity')
const topic_entity_1 = require('./topic.entity')
const user_course_progress_entity_1 = require('./user-course-progress.entity')
let Course = class Course extends base_entity_1.BaseEntity {}
exports.Course = Course
__decorate(
  [(0, typeorm_1.Column)(), __metadata('design:type', String)],
  Course.prototype,
  'title',
  void 0,
)
__decorate(
  [(0, typeorm_1.Column)({ type: 'text' }), __metadata('design:type', String)],
  Course.prototype,
  'description',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => category_entity_1.Category,
      (category) => category.courses,
      {
        onDelete: 'CASCADE',
      },
    ),
    __metadata('design:type', category_entity_1.Category),
  ],
  Course.prototype,
  'category',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => topic_entity_1.Topic,
      (topic) => topic.course,
    ),
    __metadata('design:type', Array),
  ],
  Course.prototype,
  'topics',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => user_course_progress_entity_1.UserCourseProgress,
      (ucp) => ucp.course,
    ),
    __metadata('design:type', Array),
  ],
  Course.prototype,
  'courseProgressRecords',
  void 0,
)
exports.Course = Course = __decorate([(0, typeorm_1.Entity)('courses')], Course)
//# sourceMappingURL=course.entity.js.map
