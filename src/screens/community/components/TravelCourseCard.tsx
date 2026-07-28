import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';
import { TravelCourse } from '../types';

type Props = {
  course?: TravelCourse;
};

export default function TravelCourseCard({ course }: Props) {
  if (!course) return null;

  return (
    <View style={styles.courseBox}>
      <View style={styles.courseTop}>
        <Ionicons name="map-outline" size={18} color={COLORS.primary} />
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseDays}>{course.days}</Text>
      </View>
      <Text style={styles.coursePlaces}>{course.places.join(' -> ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  courseBox: {
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 4,
  },
  courseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  courseTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  courseDays: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  coursePlaces: {
    color: COLORS.textSub,
    fontSize: 12,
    lineHeight: 18,
  },
});
