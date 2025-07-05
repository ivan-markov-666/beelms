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
exports.Test = void 0
const typeorm_1 = require('typeorm')
const base_entity_1 = require('./base.entity')
const topic_entity_1 = require('./topic.entity')
const question_entity_1 = require('./question.entity')
let Test = class Test extends base_entity_1.BaseEntity {}
exports.Test = Test
__decorate(
  [(0, typeorm_1.Column)(), __metadata('design:type', String)],
  Test.prototype,
  'title',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToOne)(
      () => topic_entity_1.Topic,
      (topic) => topic.test,
      { onDelete: 'CASCADE' },
    ),
    (0, typeorm_1.JoinColumn)({ name: 'topic_id' }),
    __metadata('design:type', topic_entity_1.Topic),
  ],
  Test.prototype,
  'topic',
  void 0,
)
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => question_entity_1.Question,
      (question) => question.test,
    ),
    __metadata('design:type', Array),
  ],
  Test.prototype,
  'questions',
  void 0,
)
exports.Test = Test = __decorate([(0, typeorm_1.Entity)('tests')], Test)
//# sourceMappingURL=test.entity.js.map
