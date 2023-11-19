import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Layout from '../components/layout';
import styles from '../styles/App.module.css';
import axios from 'axios';
import { NextPage, NextPageContext } from 'next';
import { parseCookies, resolveApiHost } from '../helpers/';
import Link from 'next/link';
import { useRouter } from "next/router";

CreateSubject.getInitialProps = ({ req, res }: NextPageContext) => {
  const cookies = parseCookies(req);
  const { protocol, hostname } = resolveApiHost(req);
  return { XSRF_TOKEN: cookies["XSRF-TOKEN"], hostname, protocol };
}

export default function CreateSubject(props: NextPage & {XSRF_TOKEN: string, hostname: string, protocol: string}) {
  const router = useRouter();
  const [ authenticated, setAuth ] = useState<Boolean>(!!props.XSRF_TOKEN);
  const [isLoading, setIsLoading] = useState(false);
  const [messageInfo, setMessageInfo] = useState({ message: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    test_chamber: '',
    date_of_birth: '',
    score: '',
    alive: false,
  });

  const api = `${props.protocol}//${props.hostname}`;

  useEffect(() => {
    if (!authenticated) {
      router.push('/');
    }
  }, [authenticated]);


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    return `${formattedDate} ${currentTime}`;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessageInfo({ message: '', type: '' });

    try {
      const response = await axios.post(
          `${api}/graphql`,
          {
            query: `
              mutation CreateSubject($name: String!, $dateOfBirth: DateTime!, $testChamber: Int!, $score: Int!, $alive: Boolean!) {
                createSubject(name: $name, date_of_birth: $dateOfBirth, test_chamber: $testChamber, score: $score, alive: $alive) {
                  id
                  name
                  date_of_birth
                  test_chamber
                  score
                  alive
                }
              }
            `,
            variables: {
              name: formData.name,
              dateOfBirth: formatDate(formData.date_of_birth),
              testChamber: parseInt(formData.test_chamber),
              score: parseInt(formData.score),
              alive: formData.alive,
            },
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
      );

      // Handle the response
      if (response.data.errors) {
        setMessageInfo({ message: 'Error: ' + response.data.errors[0].message, type: 'error' });
      } else {
        setMessageInfo({ message: 'Subject created successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      setMessageInfo({message: 'An error occured', type: 'error'});
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.main}>
            <h1>Create Test Subject</h1>
              <div className={styles.content} style={{ paddingTop: 0 }}>
                {/* Back Link */}
                <div style={{ marginBottom: '15px' }}>
                  <Link href="/subjects" passHref>
                    <button>
                      Back
                    </button>
                  </Link>
                </div>

                {/* Form Message */}
                {messageInfo.message && (
                    <div className={`${styles.formMessage} ${messageInfo.type === 'error' ? styles.errorMessage : ''}`}>
                      {messageInfo.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Name Field */}
                  <div className={styles.inputGroup}>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        onChange={handleChange}
                    />
                  </div>

                  {/* DOB Field */}
                  <div className={styles.inputGroup}>
                    <label>Date of Birth:</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        max="2999-12-31"
                        onChange={handleChange}
                    />
                  </div>

                  {/* Test Chamber Field */}
                  <div className={styles.inputGroup}>
                    <label>Test Chamber:</label>
                    <input
                        type="number"
                        name="test_chamber"
                        placeholder="Test Chamber"
                        onChange={handleChange}
                    />
                  </div>

                  {/* Score Field */}
                  <div className={styles.inputGroup}>
                    <label>Score:</label>
                    <input
                        type="number"
                        name="score"
                        placeholder="Score"
                        onChange={handleChange}
                    />
                  </div>

                  {/* Alive Checkbox */}
                  <div className={styles.inputGroup}>
                    <label>Alive:</label>
                    <input
                        type="checkbox"
                        name="alive"
                        checked={formData.alive}
                        onChange={handleChange}
                    />
                  </div>

                  <button
                      type="submit"
                      className={styles.content}
                      style={{ width: 'fit-content' }}
                      disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Subject'}
                  </button>
                </form>
              </div>
            </div>
          </div>
      </Layout>
  );
}
