import React, { useEffect, useState } from 'react'
import { Group } from './types'
import { Socket } from 'socket.io-client'

function Groups({ socket }: { socket: Socket }) {
	const [groups, setGroups] = useState<Group[]>([])
	const [groupName, setGroupName] = useState('')

	useEffect(() => {
		socket.on('newGroup', (group) => {
			console.log(group)
			setGroups((prevGroups) => {
				const newGroups = [...prevGroups, group]
				return newGroups
			})
		})

		socket.emit('getAllGroups')

		return () => {
			socket.off('newGroup')
		}
	}, [socket])

	function handleAddGroup(e) {
		e.preventDefault()
		socket.emit('joinGroup', groupName)
		setGroupName('')
	}

	return (
		<div className="max-w-xl w-full">
			{groups.map((group) => {
				console.log('Rendering group:', group.name)
				return (
					<button
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						onClick={() => console.log('Button clicked!')}
						key={group.name}
					>
						{group.name}
					</button>
				)
			})}
			<form className="max-w-xl w-full mx-auto mt-2" onSubmit={handleAddGroup}>
				<input
					className="w-full px-2 py-1 border-2 border-gray-500 rounded-md"
					autoFocus
					value={groupName}
					placeholder="add group"
					onChange={(e) => {
						setGroupName(e.currentTarget.value)
					}}
				/>
			</form>
		</div>
	)
}

export default Groups