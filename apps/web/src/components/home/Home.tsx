import { useCallback, useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api, type HelloWorldResponse } from "@/lib/api";

export default function Home() {
	const [helloData, setHelloData] = useState<HelloWorldResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchHelloWorld = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await api.hello();
			setHelloData(response);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch hello world data",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchHelloWorld();
	}, [fetchHelloWorld]);

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Sampha</h1>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<Button onClick={fetchHelloWorld} disabled={loading}>
						{loading ? "Loading..." : "Refresh"}
					</Button>
				</div>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle>API Status</CardTitle>
						<CardDescription>Hello World endpoint response</CardDescription>
					</CardHeader>
					<CardContent>
						{loading && <p>Loading...</p>}
						{error && (
							<div className="text-red-500">
								<p>Error: {error}</p>
							</div>
						)}
						{helloData && (
							<div className="text-green-600">
								<p className="font-medium">{helloData.message}</p>
								<p className="text-sm text-muted-foreground mt-2">
									Backend API is responding correctly
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
