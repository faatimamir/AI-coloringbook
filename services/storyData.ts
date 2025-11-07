
import type { StoryName } from '../types.ts';

export const storyCharacterRoles = {
  cinderella: {
    originalChar1: 'Cinderella',
    originalChar2: 'The Prince',
    char3Role: 'Fairy Godmother',
    originalChar3: 'Fairy Godmother'
  },
  snow_white: {
    originalChar1: 'Snow White',
    originalChar2: 'The Prince',
    char3Role: 'Evil Queen',
    originalChar3: 'The Queen'
  },
  jack_beanstalk: {
    originalChar1: 'Jack',
    originalChar2: 'The Giant',
    char3Role: 'Jack\'s Mother',
    originalChar3: 'Jack\'s Mother'
  },
  three_pigs: {
    originalChar1: 'The Smart Pig',
    originalChar2: 'The Big Bad Wolf',
    char3Role: 'The Other Two Pigs',
    originalChar3: 'His Two Siblings'
  },
  goldilocks: {
    originalChar1: 'Goldilocks',
    originalChar2: 'Papa Bear',
    char3Role: 'Mama & Baby Bear',
    originalChar3: 'The Rest of the Family'
  },
  red_riding_hood: {
    originalChar1: 'Little Red Riding Hood',
    originalChar2: 'The Big Bad Wolf',
    char3Role: 'The Woodsman',
    originalChar3: 'The Woodsman'
  }
};

export const titles: Record<StoryName, string> = {
    cinderella: "Cinderella's Magical Night",
    snow_white: "Snow White's Forest Friends",
    jack_beanstalk: "Jack's Giant Adventure",
    three_pigs: "The Three Pigs' Great Escape",
    goldilocks: "Goldilocks and the Just Right Day",
    red_riding_hood: "Red Riding Hood's Forest Path"
};
