export type FETOutput = {
	'?xml': string;
	fet: {
		Activities_List: {
			Activity: {
				Id: number;
				Teacher: string;
				Subject: number;
				Students: number;
				Duration: number;
				Total_Duration: number;
			}[];
		};
		Time_Constraints_List: {
			ConstraintActivityPreferredStartingTime: {
				Activity_Id: number;
				Day: number;
				Hour: number;
			}[];
		};
		Space_Constraints_List: {
			ConstraintActivityPreferredRoom: {
				Activity_Id: number;
				Room: number;
			}[];
		};
	};
};

export type FETActivity = {
	Teacher: string;
	Subject: number;
	Students: number;
	Room: number;
	Day: number;
	Period: number;
	Duration: number;
};
