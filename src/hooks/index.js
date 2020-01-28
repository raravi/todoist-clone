import { useState, useEffect } from 'react';
import { moment } from 'moment';
import { firebase } from '../firebase';
import { collatedTasksExist } from '../helpers';

export const useTasks = selectedProject => {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);

  useEffect(() => {
    let unsubscribe =
      firebase
        .firestore()
        .collection('tasks')
        .where('userId','==','QHTGwBmXACwoT6');
    unsubscribe = selectedProject && !collatedTasksExist(selectedProject)
      ? (unsubscribe = unsubscribe.where('projectId','==',selectedProject))
      : selectedProject === 'TODAY'
      ? (unsubscribe = unsubscribe.where('date','==',moment().format('DD/MM/YYYY')))
      : selectedProject === 'INBOX' || selectedProject === 0
      ? (unsubscribe = unsubscribe.where('date','==',''))
      : unsubscribe;

    unsubscribe = unsubscribe.onSnapshot(snapshot => {
      const newTasks = snapshot.docs.map(task => ({
        id: task.id,
        ...task.data()
      }));

      setTasks(
        selectedProject === 'NEXT_7'
        ? newTasks.filter(task => moment(task.date, 'DD-MM-YYYY').diff(moment(), 'days') <= 7 && task.archived !== true)
        : newTasks.filter(task => task.archived !== true)
      );

      setArchivedTasks(newTasks.filter(task => task.archived === true));
    });
    return () => unsubscribe(); // Once selectedProject changes, rerun all hooks here!
  }, [selectedProject]);

  return { tasks, archivedTasks };
}

//const selectedProject = 1;
//const { tasks, archivedTasks } = useTasks(selectedProject);

export const useProjects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    firebase
      .firestore()
      .collection('projects')
      .where('userId', '==', 'QHTGwBmXACwoT6')
      .orderBy('projectId')
      .get()
      .then(snapshot => {
        const allProjects = snapshot.docs.map(project => ({
          ...project.data(),
          docId: project.id,
        }));

        // Without this check, this hook will call itself infinitely!!!
        if (JSON.stringify(allProjects) !== JSON.stringify(projects)) {
          setProjects(allProjects);
        }
      });
  }, [projects]);

  return { projects, setProjects };
}
