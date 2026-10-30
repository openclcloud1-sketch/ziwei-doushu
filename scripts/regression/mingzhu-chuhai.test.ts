/**
 * 防再犯（ziwei-diff-proposal A1）：明珠出海 = 命未 + 太阳卯 + 太阴亥。
 * 旧条件「命未空宫 + 丑宫日月同度」与之互斥，不得再判为明珠出海。
 * patterns.ts 带 `server-only`，本测试以 `NODE_PATH=scripts/regression/stubs tsx` 运行（桩空模块）。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { detectPatterns, DEFAULT_PATTERN_SCHOOL } from '../../lib/ziwei/patterns';

const branchOf = (c: ReturnType<typeof generateChart>, n: string) =>
  c.palaces.find(p => p.stars.some(s => s.name === n))?.branch;
const hasMZ = (c: ReturnType<typeof generateChart>, school?: 'classic' | 'ni') =>
  detectPatterns(c, school ? { patternSchool: school } : {}).some(p => p.name === '明珠出海');

assert.equal(DEFAULT_PATTERN_SCHOOL, 'classic', '默认格局流派须为 classic');

// 盘 A：紫微在午、命未、太阳卯、太阴亥 → 应为明珠出海
const a = generateChart({ year: 1980, month: 1, day: 16, hour: 5, gender: 'male' });
assert.equal(a.mingGongBranch, 7, '盘A 命宫应在未');
assert.equal(branchOf(a, '紫微'), 6, '盘A 紫微应在午');
assert.equal(branchOf(a, '太阳'), 3, '盘A 太阳应在卯');
assert.equal(branchOf(a, '太阴'), 11, '盘A 太阴应在亥');
assert.ok(hasMZ(a), '盘A（默认 classic）应判明珠出海');
assert.ok(hasMZ(a, 'classic'), '盘A（classic）应判明珠出海');
assert.ok(hasMZ(a, 'ni'), '盘A（ni）应判明珠出海');

// 盘 B：命未、日月同在丑（旧条件）→ 不可为明珠出海
const b = generateChart({ year: 1980, month: 2, day: 1, hour: 6, gender: 'male' });
assert.equal(b.mingGongBranch, 7, '盘B 命宫应在未');
assert.equal(branchOf(b, '太阳'), 1, '盘B 太阳应在丑');
assert.equal(branchOf(b, '太阴'), 1, '盘B 太阴应在丑');
assert.ok(!hasMZ(b), '盘B（默认 classic）不可判明珠出海');
assert.ok(!hasMZ(b, 'classic'), '盘B（classic）不可判明珠出海');
assert.ok(!hasMZ(b, 'ni'), '盘B（ni）不可判明珠出海');

console.log('✓ 明珠出海 A1：盘A（紫微午/命未/日卯月亥）命中；盘B（命未/日月同丑）不命中；classic 与 ni 一致');
