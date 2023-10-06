const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cassandra = require('cassandra-driver');

const app = express();
const client = new cassandra.Client({ contactPoints: ['localhost'], keyspace: '2806' });

app.use(express.json());

app.post('/addTask', (req, res) => {
  const { title, description } = req.body;
  const taskId = uuidv4();

  const query = 'INSERT INTO tasks (task_id, title, description) VALUES (?, ?, ?)';
  const params = [taskId, title, description];

  client.execute(query, params, { prepare: true })
    .then(() => {
      res.json({ taskId });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.get('/listTasks', (req, res) => {
  const query = 'SELECT task_id, title FROM tasks';
  client.execute(query)
    .then(result => {
      res.json(result.rows);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.get('/viewTask/:taskId', (req, res) => {
  const { taskId } = req.params;
  const query = 'SELECT description FROM tasks WHERE task_id = ?';
  const params = [taskId];

  client.execute(query, params, { prepare: true })
    .then(result => {
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json(result.rows[0]);
      }
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.delete('/removeTask/:taskId', (req, res) => {
  const { taskId } = req.params;
  const query = 'DELETE FROM tasks WHERE task_id = ?';
  const params = [taskId];

  client.execute(query, params, { prepare: true })
    .then(() => {
      res.json({ message: 'Task removed successfully' });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
