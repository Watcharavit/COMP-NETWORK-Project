import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import Messages from './Messages'
import MessageInput from './MessageInput'
import Groups from './Groups'
import Users from './Users'
import { useOktaAuth } from '@okta/okta-react'
import { useAuth } from './auth'
import { Link } from 'react-router-dom'

function App() {
	const { oktaAuth, authState } = useOktaAuth()

	const login = async () => oktaAuth.signInWithRedirect('/')
	const logout = async () => oktaAuth.signOut('/')

	const [user, token] = useAuth()
	const [socket, setSocket] = useState(null)
	const [selectGroup, setSelectGroup] = useState(null)
	const [users, setUsers] = useState([])
	const [myUserId, setMyUserId] = useState(null)
	const [myNickname, setMyNickname] = useState(null)
	const [newNickname, setNewNickname] = useState('')

	function handleSelectGroup(groupName) {
		setSelectGroup(groupName)
	}

	function handleSelectUser(userId) {
		socket.emit('getDMGroupName', userId)
	}

	function handleSetNickname() {
		if (socket && newNickname.trim() !== '') {
			socket.emit('setNickname', newNickname)
			setNewNickname('')
		}
	}

	function getSocketOptions() {
		let option = {
			transportOptions: {
				polling: {
					extraHeaders: {
						'ngrok-skip-browser-warning': 'any',
					},
				},
			},
		}
		if (token) {
			return {
				query: { token },
				...option,
			}
		}
		return option
	}

	function getOtherUsers() {
		return users.filter(([userId, nickname]) => userId !== myUserId)
	}

	useEffect(() => {
		const newSocket = io.connect(
			process.env.REACT_APP_SERVER_URL || `http://${window.location.hostname}:3000`,
			getSocketOptions(),
		)
		setSocket(newSocket)
		return () => newSocket.disconnect()
	}, [setSocket, token])

	useEffect(() => {
		if (socket) {
			socket.on('DMGroupName', (groupName) => {
				setSelectGroup(groupName)
			})

			socket.on('getMyUser', ([userId, myNickname]) => {
				setMyUserId(userId)
				setMyNickname(myNickname)
			})

			socket.emit('getMyUser')
			socket.emit('getAllUser')

			socket.on('otherUser', ([userId, nickname]) => {
				console.log(nickname)
				setUsers((prevUsers) => [...prevUsers, [userId, nickname]])
			})

			return () => {
				socket.off('DMGroupName')
				socket.off('getMyUser')
				socket.off('otherUser')
			}
		}
	}, [socket])

	return (
		<div className="bg-gradient-to-r from-gray-800 to-gray-700 border-b-1 min-h-screen">
			<header className="py-2 px-4 text-white">
				{!authState ? (
					<div>Loading...</div>
				) : user ? (
					<div className="flex justify-between items-center">
						<div>Signed in as {user.name}</div>
						<div className="flex gap-2">
							<Link to={'/edit'}>
								<button className="px-2 py-1 bg-gray-600 rounded-md hover:bg-gray-500">
									Edit profile
								</button>
							</Link>
							<button className="px-2 py-1 bg-gray-600 rounded-md hover:bg-gray-500" onClick={logout}>
								Sign out
							</button>
						</div>
					</div>
				) : (
					<div className="flex justify-between items-center">
						<div>Not signed in</div>
						<div className="flex gap-2">
							<button className="px-2 py-1 bg-gray-600 rounded-md hover:bg-gray-500" onClick={login}>
								Sign in
							</button>
							<Link to={'/register'}>
								<button className="px-2 py-1 bg-gray-600 rounded-md hover:bg-gray-500">
									Create account
								</button>
							</Link>
						</div>
					</div>
				)}
			</header>
			{socket ? (
				<div className="bg-gray-50 p-2 mx-auto mt-2 rounded-md max-w-xl flex flex-col items-center justify-center">
					{user && (
						<div className="mb-2">
							<label htmlFor="nickname" className="mr-2">
								Set Nickname:
							</label>
							<input
								type="text"
								id="nickname"
								className="px-2 py-0.5 border-2 border-gray-500 rounded-md"
								value={newNickname}
								onChange={(e) => setNewNickname(e.target.value)}
							/>
							<button
								className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
								onClick={() => handleSetNickname()}
							>
								Update
							</button>
						</div>
					)}
					<Users onClickUser={handleSelectUser} otherUsers={getOtherUsers()} />
					<Groups socket={socket} onClickGroup={handleSelectGroup} />
					{selectGroup ? <div>current group: {selectGroup}</div> : <div>no group selected</div>}
					{selectGroup ? (
						<>
							<Messages socket={socket} groupName={selectGroup} users={users} />
							<MessageInput socket={socket} groupName={selectGroup} />
						</>
					) : (
						<></>
					)}
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center">Not Connected</div>
			)}
		</div>
	)
}

export default App
