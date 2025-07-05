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
exports.User = exports.UserRole = void 0
const typeorm_1 = require('typeorm')
const base_entity_1 = require('./base.entity')
const user_progress_entity_1 = require('./user-progress.entity')
const user_course_progress_entity_1 = require('./user-course-progress.entity')
var UserRole
;(function (UserRole) {
  UserRole['USER'] = 'user'
  UserRole['ADMIN'] = 'admin'
})(UserRole || (exports.UserRole = UserRole = {}))
let User = class User extends base_entity_1.BaseEntity {}
exports.User = User
__decorate(
  [(0, typeorm_1.Column)({ unique: true }), __metadata('design:type', String)],
  User.prototype,
  'email',
  void 0,
)
__decorate(
  [(0, typeorm_1.Column)(), __metadata('design:type', String)],
  User.prototype,
  'password',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.Column)({ type: 'enum', enum: UserRole, default: UserRole.USER }),
    __metadata('design:type', String),
  ],
  User.prototype,
  'role',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => user_progress_entity_1.UserProgress,
      (progress) => progress.user,
      { cascade: true },
    ),
    __metadata('design:type', Array),
  ],
  User.prototype,
  'progressRecords',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => user_course_progress_entity_1.UserCourseProgress,
      (progress) => progress.user,
      { cascade: true },
    ),
    __metadata('design:type', Array),
  ],
  User.prototype,
  'courseProgressRecords',
  void 0,
)
exports.User = User = __decorate([(0, typeorm_1.Entity)('users')], User)
//# sourceMappingURL=user.entity.js.map
