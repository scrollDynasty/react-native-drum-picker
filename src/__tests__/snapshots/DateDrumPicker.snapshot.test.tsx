import { render } from '@testing-library/react-native';
import React from 'react';
import { DateDrumPicker } from '../../DateDrumPicker';

describe('DateDrumPicker snapshots', () => {
  it('matches day-month-year mode', () => {
    const tree = render(
      <DateDrumPicker
        mode="day-month-year"
        value={{ day: 10, month: 5, year: 2024 }}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
