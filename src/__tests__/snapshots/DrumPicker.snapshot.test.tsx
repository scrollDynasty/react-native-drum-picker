import { render } from '@testing-library/react-native';
import React from 'react';
import { DrumPicker } from '../../DrumPicker.native';

describe('DrumPicker snapshots', () => {
  it('matches default render', () => {
    const tree = render(
      <DrumPicker items={['One', 'Two', 'Three']} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
