/**
 * 防再犯（C1–C3，口径：results/20261030-patterns-c1c3-spec.md）
 *  C1：ni 派新增 七杀朝斗／紫府夹权／日丽中天／雄宿朝元；classic 不输出
 *  C2：4 句冒名「倪师说」引文改标待考
 *  C3：巨日同宫 ni＝寅申同宫或巳↔亥对宫、双方非 dim；classic 不变
 * patterns.ts 带 `server-only`，以 `NODE_PATH=scripts/regression/stubs tsx` 运行。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateChart } from '../../lib/ziwei/algorithm';
import { detectPatterns } from '../../lib/ziwei/patterns';
import type { ZiweiChart, Star } from '../../lib/ziwei/types';

type School = 'classic' | 'ni';
const names = (c: ZiweiChart, school: School) => detectPatterns(c, { patternSchool: school }).map(p => p.name);
const find = (c: ZiweiChart, school: School, n: string) => detectPatterns(c, { patternSchool: school }).find(p => p.name === n);
const C1 = ['七杀朝斗', '紫府夹权', '日丽中天', '雄宿朝元'];

/** 最小 mock 盘：stars 为 { 地支: Star[] } */
const PNAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
function mock(ming: number, stars: Record<number, Partial<Star>[]>): ZiweiChart {
  const palaces = Array.from({ length: 12 }, (_, b) => ({
    branch: b, stem: 0,
    name: PNAMES[((ming - b) % 12 + 12) % 12],
    stars: (stars[b] ?? []).map(s => ({ type: 'major', brightness: 'normal', ...s }) as Star),
  }));
  return { palaces, mingGongBranch: ming, shenGongBranch: ming } as unknown as ZiweiChart;
}
const br = (c: ZiweiChart, n: string) => c.palaces.find(p => p.stars.some(s => s.name === n))?.branch;
const star = (c: ZiweiChart, n: string) => c.palaces.flatMap(p => p.stars).find(s => s.name === n);

// ─── C1：真盘正例（generateChart）───
const qs = generateChart({ year: 1980, month: 1, day: 24, hour: 5, gender: 'male' });
assert.ok([2, 8].includes(qs.mingGongBranch) && br(qs, '七杀') === qs.mingGongBranch, '七杀朝斗盘：七杀坐命寅/申');
assert.equal(br(qs, '紫微'), (qs.mingGongBranch + 6) % 12); assert.equal(br(qs, '天府'), (qs.mingGongBranch + 6) % 12);
assert.ok(names(qs, 'ni').includes('七杀朝斗'), 'ni 应判七杀朝斗');

const zf = generateChart({ year: 1980, month: 2, day: 3, hour: 11, gender: 'male' });
assert.ok([2, 8].includes(zf.mingGongBranch), '紫府夹权盘：命寅/申');
assert.deepEqual([br(zf, '紫微'), br(zf, '天府')].map(b => ((b! - zf.mingGongBranch + 12) % 12)).sort(), [1, 11], '紫府分夹命宫');
assert.ok(names(zf, 'ni').includes('紫府夹权'), 'ni 应判紫府夹权');

const rl = generateChart({ year: 1980, month: 1, day: 3, hour: 6, gender: 'male' });
assert.equal(rl.mingGongBranch, 6); assert.equal(br(rl, '太阳'), 6);
assert.ok(names(rl, 'ni').includes('日丽中天'), 'ni 应判日丽中天');

const xs = generateChart({ year: 1980, month: 1, day: 24, hour: 11, gender: 'male' });
const xsMing = xs.palaces.find(p => p.branch === xs.mingGongBranch)!;
assert.ok([2, 8].includes(xs.mingGongBranch));
assert.deepEqual(xsMing.stars.filter(s => s.type === 'major').map(s => s.name), ['廉贞'], '雄宿朝元盘：廉贞独守');
assert.ok(names(xs, 'ni').includes('雄宿朝元'), 'ni 应判雄宿朝元');

// classic 同盘不输出 C1 四格
for (const c of [qs, zf, rl, xs]) for (const n of C1) assert.ok(!names(c, 'classic').includes(n), `classic 不可输出 ${n}`);
for (const c of [qs, zf, rl, xs]) for (const n of C1) assert.ok(!names(c, 'classic' as School).includes(n) && !detectPatterns(c).some(p => p.name === n), `默认不可输出 ${n}`);

// ─── C1：mock 正负例 ───
assert.ok(names(mock(2, { 2: [{ name: '七杀' }], 8: [{ name: '紫微' }, { name: '天府' }] }), 'ni').includes('七杀朝斗'));
assert.ok(!names(mock(2, { 2: [{ name: '七杀' }], 8: [{ name: '紫微' }] }), 'ni').includes('七杀朝斗'), '对宫无紫府同宫不成');
assert.ok(names(mock(2, { 1: [{ name: '紫微' }], 3: [{ name: '天府' }] }), 'ni').includes('紫府夹权'));
assert.ok(!names(mock(0, { 11: [{ name: '紫微' }], 1: [{ name: '天府' }] }), 'ni').includes('紫府夹权'), '命子不成');
assert.ok(!names(mock(0, { 6: [{ name: '太阳' }] }), 'ni').includes('日丽中天'), '太阳午不在命不成');
assert.ok(names(mock(8, { 8: [{ name: '廉贞' }] }), 'ni').includes('雄宿朝元'));
assert.ok(!names(mock(2, { 2: [{ name: '廉贞' }, { name: '天府' }] }), 'ni').includes('雄宿朝元'), '廉贞非独守不成');
assert.ok(!names(mock(4, { 4: [{ name: '廉贞' }] }), 'ni').includes('雄宿朝元'), '命非寅申不成');
const xsBonus = find(mock(2, { 2: [{ name: '廉贞' }], 10: [{ name: '禄存', type: 'lucky' }] }), 'ni', '雄宿朝元')!;
assert.ok(xsBonus.conditions?.bonus?.includes('财帛宫有禄存或化禄'), '财帛（命寅→戌）有禄存为 bonus');

// ─── C2 ───
const src = readFileSync(new URL('../../lib/ziwei/patterns.ts', import.meta.url), 'utf8');
for (const q of ['禄存入身，财气近身', '天马入命，无禄不发', '辅弼夹命，平生贵人多', '魁钺夹命，必为贵人']) {
  assert.ok(!src.includes(`倪师说「${q}」`), `不得再冒名 倪师说「${q}」`);
  assert.ok(src.includes(`待考：「${q}」`) && src.includes(`引文「${q}」出处待考`), `${q} 应标待考`);
}

// ─── C3 ───
// 真盘：太阳巳、巨门亥（非 dim）
const sy = generateChart({ year: 1980, month: 1, day: 10, hour: 5, gender: 'male' });
assert.equal(br(sy, '太阳'), 5); assert.equal(br(sy, '巨门'), 11);
assert.notEqual(star(sy, '太阳')!.brightness, 'dim'); assert.notEqual(star(sy, '巨门')!.brightness, 'dim');
assert.ok(find(sy, 'ni', '巨日同宫')?.conditions?.required?.[0].includes('对宫会照'), 'ni 巳亥会照应命中');
assert.ok(!names(sy, 'classic').includes('巨日同宫'), 'classic 巳亥会照不命中');
// mock：日亥巨巳（normal 亮度）亦成；isBright 不是门槛
assert.ok(names(mock(0, { 11: [{ name: '太阳' }], 5: [{ name: '巨门' }] }), 'ni').includes('巨日同宫'), 'ni 日亥巨巳 normal 亮度应命中');
// 会照任一 dim 不成
assert.ok(!names(mock(0, { 5: [{ name: '太阳', brightness: 'bright' }], 11: [{ name: '巨门', brightness: 'dim' }] }), 'ni').includes('巨日同宫'), 'ni 巨门陷不成');
assert.ok(!names(mock(0, { 11: [{ name: '太阳', brightness: 'dim' }], 5: [{ name: '巨门' }] }), 'ni').includes('巨日同宫'), 'ni 太阳陷不成');
// 非巳亥对宫（子午）不成；午日寅巨不成
assert.ok(!names(mock(0, { 0: [{ name: '太阳' }], 6: [{ name: '巨门' }] }), 'ni').includes('巨日同宫'), 'ni 子午对宫本轮不纳');
assert.ok(!names(mock(0, { 6: [{ name: '太阳' }], 2: [{ name: '巨门' }] }), 'ni').includes('巨日同宫'), 'ni 午日寅巨不成');
// 庙旺为 bonus
assert.ok(find(mock(0, { 5: [{ name: '太阳', brightness: 'bright' }], 11: [{ name: '巨门', brightness: 'bright' }] }), 'ni', '巨日同宫')?.conditions?.bonus?.includes('太阳、巨门皆庙旺'));
// 同宫寅：两派都命中；classic 内容不变
const yin = mock(2, { 2: [{ name: '太阳', brightness: 'bright' }, { name: '巨门', brightness: 'bright' }] });
assert.ok(names(yin, 'classic').includes('巨日同宫') && names(yin, 'ni').includes('巨日同宫'), '寅同宫两派命中');
assert.equal(find(yin, 'classic', '巨日同宫')!.source, '《紫微斗数全书·巨日同宫》', 'classic 出处不变');
// 同宫申：classic 仍 breaking（caution）；ni 不一刀切
const shen = mock(8, { 8: [{ name: '太阳' }, { name: '巨门' }] });
assert.equal(find(shen, 'classic', '巨日同宫')!.level, 'caution');
assert.ok(find(shen, 'classic', '巨日同宫')!.conditions!.breaking!.includes('申宫太阳偏西，巨门暗曜更显'));
assert.notEqual(find(shen, 'ni', '巨日同宫')!.level, 'caution', 'ni 申同宫非 dim 不一律 caution');
assert.ok(!names(mock(8, { 8: [{ name: '太阳', brightness: 'dim' }, { name: '巨门' }] }), 'ni').includes('巨日同宫'), 'ni 申同宫太阳陷不成');
assert.ok(names(mock(8, { 8: [{ name: '太阳', brightness: 'dim' }, { name: '巨门' }] }), 'classic').includes('巨日同宫'), 'classic 不看亮度（不变）');

console.log('✓ C1–C3 ni 格局：C1 四格真盘+mock 正负例、classic 不输出；C2 四句已标待考；C3 巳亥会照/同宫/dim/classic 不变');
