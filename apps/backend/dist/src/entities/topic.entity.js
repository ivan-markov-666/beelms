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
exports.Topic = void 0
const typeorm_1 = require('typeorm')
const base_entity_1 = require('./base.entity')
const course_entity_1 = require('./course.entity')
const test_entity_1 = require('./test.entity')
const user_progress_entity_1 = require('./user-progress.entity')
let Topic = class Topic extends base_entity_1.BaseEntity {}
exports.Topic = Topic
__decorate(
  [(0, typeorm_1.Column)(), __metadata('design:type', String)],
  Topic.prototype,
  'title',
  void 0,
)
__decorate(
  [(0, typeorm_1.Column)({ type: 'text' }), __metadata('design:type', String)],
  Topic.prototype,
  'content',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => course_entity_1.Course,
      (course) => course.topics,
      {
        onDelete: 'CASCADE',
      },
    ),
    __metadata('design:type', course_entity_1.Course),
  ],
  Topic.prototype,
  'course',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToOne)(
      () => test_entity_1.Test,
      (test) => test.topic,
    ),
    __metadata('design:type', test_entity_1.Test),
  ],
  Topic.prototype,
  'test',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => user_progress_entity_1.UserProgress,
      (progress) => progress.topic,
    ),
    __metadata('design:type', Array),
  ],
  Topic.prototype,
  'progressRecords',
  void 0,
)
exports.Topic = Topic = __decorate([(0, typeorm_1.Entity)('topics')], Topic)
//# sourceMappingURL=topic.entity.js.map
