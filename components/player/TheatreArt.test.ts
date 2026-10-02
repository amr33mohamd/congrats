import { expect, it } from 'vitest';
import { initialsOf } from './TheatreArt';

it('takes one initial from each name for the monogram', () => {
  expect(initialsOf('Omar & Nour')).toEqual(['O', 'N']);
  expect(initialsOf('farid and basma')).toEqual(['F', 'B']);
  expect(initialsOf('عمر & نور')).toEqual(['ع', 'ن']);
  expect(initialsOf('عمر و نور')).toEqual(['ع', 'ن']);
  expect(initialsOf('Omar')).toBeNull();
});
